import { redis } from './redis';
import { logger } from '../../utils/logger';
import { generateOneTimeCode, hashOpaqueCode } from '../../utils/crypto';

export type VerificationFlowRecord = {
  userId: string;
  orgId: string;
  email: string;
  callbackUrl: string;
  state: string;
  issuedAt: string;
  expiresAt: string;
};

export type AuthCodeGrantRecord = {
  userId: string;
  orgId: string;
  callbackUrl: string;
  state: string;
  issuedAt: string;
  expiresAt: string;
};

const getVerificationFlowRedisKey = (verificationFlowId: string) =>
  `org_verification_flow:${verificationFlowId}`;

const getAuthCodeRedisKey = (hashedCode: string) => `org_auth_code:${hashedCode}`;

/**
 * @description Checks that the value looks like a persisted verification flow record.
 */
const isVerificationFlowRecord = (value: unknown): value is VerificationFlowRecord => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.userId === 'string' &&
    typeof record.orgId === 'string' &&
    typeof record.email === 'string' &&
    typeof record.callbackUrl === 'string' &&
    typeof record.state === 'string' &&
    typeof record.issuedAt === 'string' &&
    typeof record.expiresAt === 'string'
  );
};

/**
 * @description Checks that the value looks like a persisted auth code grant record.
 */
const isAuthCodeGrantRecord = (value: unknown): value is AuthCodeGrantRecord => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.userId === 'string' &&
    typeof record.orgId === 'string' &&
    typeof record.callbackUrl === 'string' &&
    typeof record.state === 'string' &&
    typeof record.issuedAt === 'string' &&
    typeof record.expiresAt === 'string'
  );
};

/**
 * @description Stores a short-lived verification flow so email verification can continue without a session token.
 */
export const createVerificationFlowInRedis = async ({
  verificationFlowId,
  record,
  expiresInSeconds,
}: {
  verificationFlowId: string;
  record: VerificationFlowRecord;
  expiresInSeconds: number;
}) => {
  const redisKey = getVerificationFlowRedisKey(verificationFlowId);
  await redis.set(redisKey, JSON.stringify(record), { EX: expiresInSeconds });
  logger.debug({ redisKey, userId: record.userId, orgId: record.orgId }, 'Verification flow stored.');
};

/**
 * @description Loads and validates a stored verification flow from Redis.
 */
export const getVerificationFlowFromRedis = async (verificationFlowId: string) => {
  const redisKey = getVerificationFlowRedisKey(verificationFlowId);
  const raw = await redis.get(redisKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isVerificationFlowRecord(parsed)) {
      logger.warn({ redisKey }, 'Invalid verification flow found in Redis.');
      return null;
    }
    return parsed;
  } catch (error) {
    logger.error({ redisKey, error }, 'Failed to parse verification flow from Redis.');
    return null;
  }
};

/**
 * @description Deletes a verification flow after it is consumed or invalidated.
 */
export const deleteVerificationFlowFromRedis = async (verificationFlowId: string) => {
  const redisKey = getVerificationFlowRedisKey(verificationFlowId);
  await redis.del(redisKey);
  logger.debug({ redisKey }, 'Verification flow deleted.');
};

/**
 * @description Creates a short-lived one-time auth code grant and returns the raw code for redirect handoff.
 */
export const createAuthCodeGrantInRedis = async ({
  record,
  expiresInSeconds,
}: {
  record: AuthCodeGrantRecord;
  expiresInSeconds: number;
}) => {
  const code = generateOneTimeCode();
  const hashedCode = hashOpaqueCode(code);
  const redisKey = getAuthCodeRedisKey(hashedCode);

  await redis.set(redisKey, JSON.stringify(record), { EX: expiresInSeconds });
  logger.debug({ redisKey, userId: record.userId, orgId: record.orgId }, 'Auth code grant stored.');

  return { code, hashedCode };
};

/**
 * @description Atomically loads and removes a one-time auth code grant to prevent replay.
 */
export const consumeAuthCodeGrantFromRedis = async (code: string) => {
  const hashedCode = hashOpaqueCode(code);
  const redisKey = getAuthCodeRedisKey(hashedCode);

  try {
    const raw = await redis.sendCommand(['GETDEL', redisKey]);
    if (!raw || typeof raw !== 'string') {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!isAuthCodeGrantRecord(parsed)) {
      logger.warn({ redisKey }, 'Invalid auth code grant found in Redis.');
      return null;
    }

    return parsed;
  } catch (error) {
    logger.error({ redisKey, error }, 'Failed to consume auth code grant from Redis.');
    return null;
  }
};
