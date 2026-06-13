import { prisma } from '@zentry/database';
import { Role, ProviderType } from '@zentry/database/generated/prisma/enums';
import { redis } from '../../../lib/redis';
import { logger } from '../../../utils/logger';
import { DEFAULT_SESSION_EXPIRY_IN_SECONDS } from '../../../constants';

type createSessionInTheDatabaseProps = {
  userId: string;
  token: string;
  expiresAt: Date;
  organizationId?: string;
  permissions?: string;
  ipAddress?: string;
  userAgent?: string;
};
/**
 * @description This function is used to create a session in the database.
 * @param {createSessionInTheDatabaseProps} props - The properties of the session to be created.
 * @returns The created session.
 * */
export const createSessionInTheDatabase = async (props: createSessionInTheDatabaseProps) => {
  const { userId, token, expiresAt, organizationId, permissions, ipAddress, userAgent } = props;

  try {
    logger.info('Creating session in the database.');
    return prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        organizationId,
        permissions,
        ipAddress,
        userAgent,
      },
    });
  } catch (e) {
    logger.error({ e }, 'Failed to create session in the database.');
    throw e;
  }
};

/**
 * @description Type definition for the properties of the session object.
 * */
type createSessionInTheRedisProps = {
  token: string;
  expiresInSeconds?: number;
  sessionObject: {
    sessionId: string; // id of the db record
    ipAddress?: string;
    user: {
      id: string;
      emailVerified: boolean;
    };
    account: {
      id: string;
      userId: string; // user id
      accountId: string; // user id or OAuth provider id
      providerType: ProviderType; // CREDENTIAL or OAUTH
    };
    org: {
      id?: string;
      permissions?: string;
      isBanned?: boolean;
      role?: Role; // ADMIN, MEMBER
    };
  };
};
/**
 * @description This function is used to create a session in the Redis cache.
 * @param {createSessionInTheRedisProps} props - The properties of the session to be created.
 * @returns {Promise<void>} A promise that resolves when the session is created in the Redis cache.
 * */
export const createSessionInTheRedis = async (
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
