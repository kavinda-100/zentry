import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../../utils/logger';
import { ErrorResponse, OKResponse } from '../../../utils/responseHandles';
import { StatusCodes } from '../../../utils/statusCodes';
import { prisma } from '@zentry/database';
import {
  formatZodIssues,
  orgUserAuthCallbackUrlQuerySchema,
  orgUserLoginSchema,
  orgUserRegisterSchema,
  orgUserVerifyEmailSchema,
} from '@zentry/validation';
import {
  generateOtp,
  generateSessionToken,
  hashPassword,
  verifyPassword,
} from '../../../utils/crypto';
import { DEFAULT_SESSION_EXPIRY_IN_SECONDS, SESSION_TOKEN_COOKIE_NAME } from '../../../constants';
import {
  createAuthSessionInTheRedis,
  deleteAuthSessionFromRedis,
  updateAuthSessionInRedis,
  type createSessionInTheRedisProps,
} from '../../../lib/redis/auth.redis';
import { redis } from '../../../lib/redis/redis';
import { publishAuthEvent } from '../../../lib/kafka';

type createSessionProps = {
  userId: string;
  orgId: string;
  permissions: string[];
  ipAddress?: string;
  userAgent?: string;
  expiresInSeconds?: Date;
};

// Persists an org-scoped session row and returns the opaque client token.
const createSessionInDb = async (props: createSessionProps) => {
  const sessionToken = generateSessionToken();

  // save the session in the database
  logger.info('Creating session in the database.');
  const dbSessionRecord = await prisma.session.create({
    data: {
      userId: props.userId,
      token: sessionToken,
      expiresAt:
        props.expiresInSeconds ?? new Date(Date.now() + DEFAULT_SESSION_EXPIRY_IN_SECONDS * 1000),
      organizationId: props.orgId,
      permissions: JSON.stringify(props.permissions),
      ipAddress: props.ipAddress,
      userAgent: props.userAgent || 'unknown',
    },
  });
  return { sessionToken, dbSessionRecord };
};

// Mirrors the org-scoped session snapshot into Redis for request-time auth checks.
const createSessionInRedis = async (props: createSessionInTheRedisProps) => {
  logger.info('Creating session in the Redis cache.');
  // save the session in the Redis cache
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

// Applies the standard session cookie so browser clients can authenticate follow-up requests.
const setSessionCookie = (res: Response, sessionToken: string) => {
  res.cookie(SESSION_TOKEN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: DEFAULT_SESSION_EXPIRY_IN_SECONDS * 1000,
  });
};

// Stores the app callback target until org verification or redirect completes.
const saveOrgUserCallBackUrlInRedis = async (userId: string, callbackUrl: string) => {
  logger.info('Saving org user callback url in redis.');
  await redis.set(`orgUserCallbackUrl:${userId}`, callbackUrl, {
    EX: 30 * 60, // 30 minutes
  });
};

// Reads the pending callback target for the current org auth flow.
const getOrgUserCallbackUrlFromRedis = async (userId: string) => {
  logger.info('Reading org user callback url from redis.');
  return redis.get(`orgUserCallbackUrl:${userId}`);
};

// Clears the pending callback target once the flow is finished or invalidated.
const deleteOrgUserCallbackUrlFromRedis = async (userId: string) => {
  logger.info('Deleting org user callback url from redis.');
  await redis.del(`orgUserCallbackUrl:${userId}`);
};

// Adds the session token to the callback URL without breaking existing query params.
const buildCallbackUrlWithToken = (callbackUrl: string, sessionToken: string) => {
  const redirectUrl = new URL(callbackUrl);
  redirectUrl.searchParams.set('token', sessionToken);
  return redirectUrl;
};

// Enforces that redirects only go to URLs registered on the organization.
const isAllowedOrgCallbackUrl = (callbackUrl: string, allowedCallbackUrls: string[]) => {
  return allowedCallbackUrls.includes(callbackUrl);
};

// utility function to generate OTP, save it to the database and send a Kafka message to trigger email sending in the email service.
const generateSaveAndSendmailVerification = async ({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) => {
  logger.info('Generating and sending email verification.');

  const otp = generateOtp();
  await prisma.$transaction(async (tx) => {
    await tx.otpCode.deleteMany({
      where: {
        userId,
        purpose: 'EMAIL_VERIFICATION',
      },
    });

    await tx.otpCode.create({
      data: {
        userId,
        code: otp,
        purpose: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP expires in 10 minutes
      },
    });
  });

  // send Kafka message to send email verification
  await publishAuthEvent({
    type: 'EMAIL_VERIFICATION',
    userId: userId,
    payload: {
      otp: otp,
      to: email,
    },
  });
};

// Creates the org-scoped DB + Redis session pair used by register and login.
const createOrgSession = async ({
  req,
  userId,
  emailVerified,
  accountId,
  provider,
  providerType,
  accountProviderId,
}: {
  req: Request;
  userId: string;
  emailVerified: boolean;
  accountId: string;
  provider: 'LOCAL';
  providerType: 'CREDENTIAL';
  accountProviderId: string;
}) => {
  const { sessionToken, dbSessionRecord } = await createSessionInDb({
    orgId: req.org.id!,
    userId,
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
        id: userId,
        emailVerified,
      },
      org: {
        id: req.org.id!,
        permissions: JSON.stringify([]),
        isBanned: false,
        role: 'MEMBER',
      },
      account: {
        id: accountId,
        userId,
        accountId: accountProviderId,
        provider,
        providerType,
      },
    },
  });

  return { sessionToken };
};

// Loads the org callback allowlist and validates the requested callback target.
const validateOrgCallbackUrl = async (orgId: string, callbackUrl: string) => {
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

// Deletes every session for a user inside one organization from both DB and Redis.
const deleteOrgSessions = async (userId: string, orgId: string) => {
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
 * @description The registration flow for an organization user.
 * @returns either a success response or an error response or rediract.
 * */
export const orgRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Org register auth route hit');

    const orgId = req.org.id;
    if (!orgId) {
      return ErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Organization not found in request context.',
      );
    }

    const validatedQuery = orgUserAuthCallbackUrlQuerySchema.safeParse(req.query);
    if (!validatedQuery.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request query', {
        issues: formatZodIssues(validatedQuery.error.issues),
      });
    }

    const validatedBody = orgUserRegisterSchema.safeParse(req.body);
    if (!validatedBody.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request body', {
        issues: formatZodIssues(validatedBody.error.issues),
      });
    }

    const callbackValidation = await validateOrgCallbackUrl(orgId, validatedQuery.data.callbackUrl);
    if (!callbackValidation.success) {
      return ErrorResponse(res, callbackValidation.statusCode, callbackValidation.message);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedBody.data.email },
    });

    let user = existingUser;
    let account;

    if (existingUser) {
      account = await prisma.account.findFirst({
        where: {
          userId: existingUser.id,
          provider: 'LOCAL',
          providerType: 'CREDENTIAL',
        },
      });

      if (!account) {
        return ErrorResponse(
          res,
          StatusCodes.CONFLICT,
          'A user with this email already exists, but does not have a LOCAL account.',
        );
      }

      const updatedRecords = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            firstName: validatedBody.data.firstName,
            lastName: validatedBody.data.lastName,
            imageUrl: validatedBody.data.imageUrl,
          },
        });

        await tx.membership.upsert({
          where: {
            userId_organizationId: {
              userId: existingUser.id,
              organizationId: orgId,
            },
          },
          update: {
            role: 'MEMBER',
            isBanned: false,
            permissions: JSON.stringify([]),
          },
          create: {
            userId: existingUser.id,
            organizationId: orgId,
            role: 'MEMBER',
            permissions: JSON.stringify([]),
          },
        });

        return { updatedUser };
      });

      user = updatedRecords.updatedUser;
    } else {
      const createdRecords = await prisma.$transaction(async (tx) => {
        const hashedPassword = await hashPassword(validatedBody.data.password);

        const newUser = await tx.user.create({
          data: {
            email: validatedBody.data.email,
            firstName: validatedBody.data.firstName,
            lastName: validatedBody.data.lastName,
            imageUrl: validatedBody.data.imageUrl,
            emailVerified: false,
          },
        });
        const newAccount = await tx.account.create({
          data: {
            userId: newUser.id,
            provider: 'LOCAL',
            accountId: newUser.id,
            hashedPassword,
            providerType: 'CREDENTIAL',
          },
        });
        await tx.membership.create({
          data: {
            userId: newUser.id,
            organizationId: orgId,
            role: 'MEMBER',
            permissions: JSON.stringify([]),
          },
        });

        return { newUser, newAccount };
      });

      user = createdRecords.newUser;
      account = createdRecords.newAccount;
    }

    if (!user || !account) {
      return ErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to prepare org user.');
    }

    const { sessionToken } = await createOrgSession({
      req,
      userId: user.id,
      emailVerified: user.emailVerified,
      accountId: account.id,
      provider: 'LOCAL',
      providerType: 'CREDENTIAL',
      accountProviderId: account.accountId,
    });

    setSessionCookie(res, sessionToken);

    const callbackUrlWithToken = buildCallbackUrlWithToken(
      validatedQuery.data.callbackUrl,
      sessionToken,
    );

    if (!user.emailVerified) {
      await saveOrgUserCallBackUrlInRedis(user.id, callbackUrlWithToken.toString());
      await generateSaveAndSendmailVerification({
        userId: user.id,
        email: user.email,
      });

      return OKResponse(
        res,
        StatusCodes.OK,
        'User registered successfully - email verification pending.',
        {
          session: {
            token: sessionToken,
          },
          verificationRequired: true,
        },
      );
    }

    return res.redirect(callbackUrlWithToken.toString());
  } catch (e) {
    next(e);
  }
};

/**
 * @description Authenticates an existing LOCAL org user and redirects them to the app callback URL.
 * */
export const orgLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Org login auth route hit');

    const orgId = req.org.id;
    if (!orgId) {
      return ErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Organization not found in request context.',
      );
    }

    const validatedQuery = orgUserAuthCallbackUrlQuerySchema.safeParse(req.query);
    if (!validatedQuery.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request query', {
        issues: formatZodIssues(validatedQuery.error.issues),
      });
    }

    const validatedBody = orgUserLoginSchema.safeParse(req.body);
    if (!validatedBody.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request body', {
        issues: formatZodIssues(validatedBody.error.issues),
      });
    }

    const callbackValidation = await validateOrgCallbackUrl(orgId, validatedQuery.data.callbackUrl);
    if (!callbackValidation.success) {
      return ErrorResponse(res, callbackValidation.statusCode, callbackValidation.message);
    }

    const user = await prisma.user.findUnique({
      where: { email: validatedBody.data.email },
    });
    if (!user) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
    }

    if (!user.emailVerified) {
      return ErrorResponse(res, StatusCodes.FORBIDDEN, 'Email not verified');
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: 'LOCAL',
        providerType: 'CREDENTIAL',
      },
    });
    if (!account || account.hashedPassword === null) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Wrong authentication method');
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
    });
    if (!membership || membership.isBanned) {
      return ErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        'You are not allowed to access this organization.',
      );
    }

    const isPasswordCorrect = verifyPassword(validatedBody.data.password, account.hashedPassword);
    if (!isPasswordCorrect) {
      return ErrorResponse(res, StatusCodes.UNAUTHORIZED, 'Invalid credentials');
    }

    await deleteOrgSessions(user.id, orgId);

    const { sessionToken } = await createOrgSession({
      req,
      userId: user.id,
      emailVerified: user.emailVerified,
      accountId: account.id,
      provider: 'LOCAL',
      providerType: 'CREDENTIAL',
      accountProviderId: account.accountId,
    });

    setSessionCookie(res, sessionToken);

    const callbackUrlWithToken = buildCallbackUrlWithToken(
      validatedQuery.data.callbackUrl,
      sessionToken,
    );

    return res.redirect(callbackUrlWithToken.toString());
  } catch (e) {
    next(e);
  }
};

/**
 * @description Verifies an organization user's email and redirects them to the stored callback URL.
 * */
export const orgVerifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Org verify email auth route hit');

    const orgId = req.org.id;
    if (!orgId) {
      return ErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Organization not found in request context.',
      );
    }

    const validatedBody = orgUserVerifyEmailSchema.safeParse(req.body);
    if (!validatedBody.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request body', {
        issues: formatZodIssues(validatedBody.error.issues),
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    if (!user) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
    }

    if (user.email !== validatedBody.data.email) {
      return ErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        'You can only verify the authenticated organization user.',
      );
    }

    if (user.emailVerified) {
      const callbackUrl = await getOrgUserCallbackUrlFromRedis(user.id);
      if (callbackUrl) {
        await deleteOrgUserCallbackUrlFromRedis(user.id);
        return res.redirect(callbackUrl);
      }

      return OKResponse(res, StatusCodes.OK, 'Email already verified', null);
    }

    const otpCode = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        purpose: 'EMAIL_VERIFICATION',
        code: validatedBody.data.otp,
      },
    });
    if (!otpCode) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid OTP');
    }

    if (otpCode.expiresAt < new Date()) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'OTP has expired');
    }

    const callbackUrl = await getOrgUserCallbackUrlFromRedis(user.id);
    if (!callbackUrl) {
      return ErrorResponse(
        res,
        StatusCodes.GONE,
        'Verification session has expired. Please restart registration.',
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });

      await tx.otpCode.delete({
        where: { id: otpCode.id },
      });
    });

    const isUpdated = await updateAuthSessionInRedis({
      token: req.token,
      updates: {
        user: { emailVerified: true },
      },
    });
    if (!isUpdated) {
      logger.debug('Failed to update org session in Redis cache.');
    }

    await deleteOrgUserCallbackUrlFromRedis(user.id);
    return res.redirect(callbackUrl);
  } catch (e) {
    next(e);
  }
};

/**
 * @description Logs out the authenticated org user by removing their org-scoped sessions.
 * */
export const orgLogout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Org logout auth route hit');

    const orgId = req.org.id;
    if (!orgId) {
      return ErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Organization not found in request context.',
      );
    }

    await deleteOrgSessions(req.user.id, orgId);
    await deleteOrgUserCallbackUrlFromRedis(req.user.id);

    res.clearCookie(SESSION_TOKEN_COOKIE_NAME);

    return OKResponse(res, StatusCodes.OK, 'User logged out successfully');
  } catch (e) {
    next(e);
  }
};

/**
 * @description Returns the authenticated session in the shared SDK session shape for a specific org.
 * */
export const getOrgMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Get org me auth route hit');

    const orgId = req.org.id;
    if (!orgId) {
      return ErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Organization not found in request context.',
      );
    }

    const [user, account, org, membership] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user.id },
      }),
      prisma.account.findFirst({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.organization.findUnique({
        where: { id: orgId },
      }),
      prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: req.user.id,
            organizationId: orgId,
          },
        },
      }),
    ]);

    if (!user) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
    }

    if (!account) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'Account not found');
    }

    if (!org) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'Organization not found');
    }

    if (!membership || membership.isBanned) {
      return ErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        'You are not allowed to access this organization.',
      );
    }

    // this object is shape of the SDK session shape
    // in `packages/sdk/src/zod.ts` - `ZentrySessionSchema` schema
    const responseBody = {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      org: {
        id: org.id,
        name: org.name,
      },
      membership: {
        id: membership.id,
        role: membership.role,
        isBanned: membership.isBanned,
        permissions: membership.permissions,
      },
      account: {
        id: account.id,
        provider: account.provider,
        providerType: account.providerType,
        accountId: account.accountId,
        providerAvatarUrl: account.providerAvatarUrl,
      },
    };

    OKResponse(res, StatusCodes.OK, 'Organization session details', responseBody);
  } catch (e) {
    next(e);
  }
};
