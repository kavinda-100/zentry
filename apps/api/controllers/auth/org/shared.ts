import type { Request, Response } from 'express';
import { prisma } from '@zentry/database';
import { formatZodIssues, orgUserAuthCallbackUrlQuerySchema } from '@zentry/validation';
import type { AuthProviderEnumType, ProviderEnumType } from '@zentry/validation/src/auth';
import { logger } from '../../../utils/logger';
import { ErrorResponse } from '../../../utils/responseHandles';
import { StatusCodes } from '../../../utils/statusCodes';
import { generateSessionToken } from '../../../utils/crypto';
import { DEFAULT_SESSION_EXPIRY_IN_SECONDS } from '../../../constants';
import {
  createAuthSessionInTheRedis,
  deleteAuthSessionFromRedis,
  type createSessionInTheRedisProps,
} from '../../../lib/redis/auth.redis';
import { createAuthCodeGrantInRedis } from '../../../lib/redis/org-auth-flow.redis';

const AUTH_CODE_EXPIRY_IN_SECONDS = 60;

type CreateSessionProps = {
  userId: string;
  orgId: string;
  permissions: string[];
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: Date;
};

export type SessionActorDetails = {
  userId: string;
  emailVerified: boolean;
  accountId: string;
  provider: AuthProviderEnumType;
  providerType: ProviderEnumType;
  accountProviderId: string;
};

/**
 * @description Persists an org-scoped session row and returns the opaque client token.
 */
const createSessionInDb = async (props: CreateSessionProps) => {
  const sessionToken = generateSessionToken();

  logger.info('Creating session in the database.');
  const dbSessionRecord = await prisma.session.create({
    data: {
      userId: props.userId,
      token: sessionToken,
      expiresAt: props.expiresAt ?? new Date(Date.now() + DEFAULT_SESSION_EXPIRY_IN_SECONDS * 1000),
      organizationId: props.orgId,
      permissions: JSON.stringify(props.permissions),
      ipAddress: props.ipAddress,
      userAgent: props.userAgent || 'unknown',
    },
  });

  return { sessionToken, dbSessionRecord };
};

/**
 * @description Mirrors the org-scoped session snapshot into Redis for request-time auth checks.
 */
const createSessionInRedis = async (props: createSessionInTheRedisProps) => {
  logger.info('Creating session in the Redis cache.');

  await createAuthSessionInTheRedis({
    token: props.token,
    expiresInSeconds: props.expiresInSeconds ?? DEFAULT_SESSION_EXPIRY_IN_SECONDS,
    sessionObject: {
      sessionId: props.sessionObject.sessionId,
      ipAddress: props.sessionObject.ipAddress,
      user: {
        id: props.sessionObject.user.id,
        emailVerified: props.sessionObject.user.emailVerified,
      },
      account: {
        id: props.sessionObject.account.id,
        userId: props.sessionObject.user.id,
        accountId: props.sessionObject.account.accountId,
        provider: props.sessionObject.account.provider,
        providerType: props.sessionObject.account.providerType,
      },
      org: {
        id: props.sessionObject.org.id,
        permissions: props.sessionObject.org.permissions,
        isBanned: props.sessionObject.org.isBanned,
      },
    },
  });
};

/**
 * @description Enforces that redirects only go to URLs registered on the organization.
 */
const isAllowedOrgCallbackUrl = (callbackUrl: string, allowedCallbackUrls: string[]) => {
  return allowedCallbackUrls.includes(callbackUrl);
};

/**
 * @description Loads the org callback allowlist and validates the requested callback target.
 */
export const validateOrgCallbackUrl = async (orgId: string, callbackUrl: string) => {
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      appCallbackUrl: true,
    },
  });

  if (!organization) {
    return {
      success: false as const,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Organization not found',
    };
  }

  if (!isAllowedOrgCallbackUrl(callbackUrl, organization.appCallbackUrl)) {
    return {
      success: false as const,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Callback URL is not allowed.',
    };
  }

  return {
    success: true as const,
  };
};

/**
 * @description Deletes every session for a user inside one organization from both DB and Redis.
 */
export const deleteOrgSessions = async (userId: string, orgId: string) => {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      organizationId: orgId,
    },
    select: {
      token: true,
    },
  });

  await prisma.session.deleteMany({
    where: {
      userId,
      organizationId: orgId,
    },
  });

  await Promise.all(
    sessions.map((session) => deleteAuthSessionFromRedis({ token: session.token })),
  );
};

/**
 * @description Creates the final organization session only after the auth code exchange succeeds.
 */
export const createOrgSession = async ({
  req,
  actor,
}: {
  req: Request;
  actor: SessionActorDetails;
}) => {
  const { sessionToken, dbSessionRecord } = await createSessionInDb({
    orgId: req.org.id!,
    userId: actor.userId,
    permissions: [],
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  await createSessionInRedis({
    token: sessionToken,
    sessionObject: {
      sessionId: dbSessionRecord.id,
      ipAddress: req.ip,
      user: {
        id: actor.userId,
        emailVerified: actor.emailVerified,
      },
      org: {
        id: req.org.id!,
        permissions: JSON.stringify([]),
        isBanned: false,
        role: 'MEMBER',
      },
      account: {
        id: actor.accountId,
        userId: actor.userId,
        accountId: actor.accountProviderId,
        provider: actor.provider,
        providerType: actor.providerType,
      },
    },
  });

  return { sessionToken };
};

/**
 * @description Shapes the redirect response with a one-time code instead of a session token.
 */
const buildReadyForRedirectResponse = ({
  code,
  callbackUrl,
  state,
  expiresAt,
}: {
  code: string;
  callbackUrl: string;
  state: string;
  expiresAt: Date;
}) => ({
  status: 'READY_FOR_REDIRECT' as const,
  code,
  callbackUrl,
  state,
  expiresAt: expiresAt.toISOString(),
});

/**
 * @description Creates a one-time auth code grant for a verified organization user.
 */
export const createReadyForRedirectResponse = async ({
  userId,
  orgId,
  callbackUrl,
  state,
}: {
  userId: string;
  orgId: string;
  callbackUrl: string;
  state: string;
}) => {
  const expiresAt = new Date(Date.now() + AUTH_CODE_EXPIRY_IN_SECONDS * 1000);
  const { code } = await createAuthCodeGrantInRedis({
    expiresInSeconds: AUTH_CODE_EXPIRY_IN_SECONDS,
    record: {
      userId,
      orgId,
      callbackUrl,
      state,
      issuedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
  });

  return buildReadyForRedirectResponse({
    code,
    callbackUrl,
    state,
    expiresAt,
  });
};

/**
 * @description Validates org auth query params and callback allowlist together.
 */
export const validateOrgAuthRequestQuery = async (req: Request, res: Response) => {
  const orgId = req.org.id;
  if (!orgId) {
    ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Organization not found in request context.');
    return null;
  }

  const validatedQuery = orgUserAuthCallbackUrlQuerySchema.safeParse(req.query);
  if (!validatedQuery.success) {
    ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request query', {
      issues: formatZodIssues(validatedQuery.error.issues),
    });
    return null;
  }

  const callbackValidation = await validateOrgCallbackUrl(orgId, validatedQuery.data.callbackUrl);
  if (!callbackValidation.success) {
    ErrorResponse(res, callbackValidation.statusCode, callbackValidation.message);
    return null;
  }

  return { orgId, query: validatedQuery.data };
};
