import { redis } from './redis';
import { logger } from '../../utils/logger';
import { DEFAULT_SESSION_EXPIRY_IN_SECONDS } from '../../constants';
import type { SessionObjectSchemaType } from '@zentry/validation/src/auth';

/**
 * @description Type definition for the properties of the session object.
 * */
type createSessionInTheRedisProps = {
  token: string;
  expiresInSeconds?: number;
  sessionObject: SessionObjectSchemaType;
};
/**
 * @description This function is used to create a session in the Redis cache.
 * @param {createSessionInTheRedisProps} props - The properties of the session to be created.
 * @returns {Promise<void>} A promise that resolves when the session is created in the Redis cache.
 * */
export const createAuthSessionInTheRedis = async (
  props: createSessionInTheRedisProps,
): Promise<void> => {
  const { token, sessionObject, expiresInSeconds } = props;
  const { ipAddress, user, account, org, sessionId } = sessionObject;

  const ttl = expiresInSeconds || DEFAULT_SESSION_EXPIRY_IN_SECONDS;
  const redisKey = `session:${token}`;

  try {
    await redis.set(
      redisKey,
      JSON.stringify({
        sessionId,
        ipAddress,
        user,
        account,
        org,
      }),
      { EX: ttl },
    );

    logger.debug(
      { sessionId: sessionId, userId: user.id, accountId: account.id, orgId: org.id },
      'Session snapshot synchronized to Redis cache.',
    );
  } catch (error) {
    // Treat cache write faults seriously in your identity provider logs
    logger.error(
      { error, sessionId: sessionId },
      'Failed to commit session state matrix to Redis cluster',
    );
    throw error;
  }
};

type UpdateSessionInRedisProps = {
  token: string;
  updates: {
    user?: Partial<createSessionInTheRedisProps['sessionObject']['user']>;
    account?: Partial<createSessionInTheRedisProps['sessionObject']['account']>;
    org?: Partial<createSessionInTheRedisProps['sessionObject']['org']>;
  };
};

/**
 * @description Updates mutable properties of an active Redis session while preserving its exact remaining TTL.
 */
export const updateAuthSessionInRedis = async (
  props: UpdateSessionInRedisProps,
): Promise<boolean> => {
  const { token, updates } = props;
  const redisKey = `session:${token}`;

  try {
    // Fetch the existing session data and its remaining TTL concurrently
    const [existingSessionRaw, remainingTtl] = await Promise.all([
      redis.get(redisKey),
      redis.ttl(redisKey),
    ]);

    // If the session doesn't exist (e.g., expired or revoked), abort early
    if (!existingSessionRaw || remainingTtl <= 0) {
      logger.warn(
        { redisKey },
        'Attempted to update a session that does not exist or has expired.',
      );
      return false;
    }

    const sessionObject: createSessionInTheRedisProps['sessionObject'] =
      JSON.parse(existingSessionRaw);

    // Apply deeply nested patch updates safely
    if (updates.user) {
      sessionObject.user = { ...sessionObject.user, ...updates.user };
    }
    if (updates.org) {
      sessionObject.org = { ...sessionObject.org, ...updates.org };
    }
    if (updates.account) {
      sessionObject.account = { ...sessionObject.account, ...updates.account };
    }

    // Write back to Redis using the exact remaining TTL duration
    await redis.set(redisKey, JSON.stringify(sessionObject), {
      EX: remainingTtl,
    });

    logger.debug(
      { sessionId: sessionObject.sessionId, userId: sessionObject.user.id },
      'Session state properties successfully updated in Redis cache.',
    );

    return true;
  } catch (error) {
    logger.error({ error, redisKey }, 'Failed to update session state in Redis cache.');
    return false;
  }
};

type DeleteSessionFromRedisProps = {
  token: string;
};

/**
 * @description This function is used to delete a session from the Redis cache.
 * @param {DeleteSessionFromRedisProps} props - The properties of the session to be deleted.
 * @returns {Promise<void>} A promise that resolves when the session is deleted from the Redis cache.
 * */
export const deleteAuthSessionFromRedis = async (
  props: DeleteSessionFromRedisProps,
): Promise<void> => {
  const { token } = props;
  const redisKey = `session:${token}`;

  try {
    await redis.del(redisKey);
    logger.debug({ redisKey }, 'Session successfully deleted from Redis cache.');
  } catch (error) {
    logger.error({ error, redisKey }, 'Failed to delete session from Redis cache.');
    throw error;
  }
};
