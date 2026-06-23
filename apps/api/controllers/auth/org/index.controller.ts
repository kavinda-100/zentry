import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../../utils/logger';
import { ErrorResponse, OKResponse } from '../../../utils/responseHandles';
import { StatusCodes } from '../../../utils/statusCodes';
import { prisma } from '@zentry/database';
import { orgUserAuthCallbackUrlParamSchema, orgUserRegisterSchema } from '@zentry/validation';
import { generateOtp, generateSessionToken, hashPassword } from '../../../utils/crypto';
import { DEFAULT_SESSION_EXPIRY_IN_SECONDS } from '../../../constants';
import {
  createAuthSessionInTheRedis,
  type createSessionInTheRedisProps,
} from '../../../lib/redis/auth.redis';
import { redis } from '../../../lib/redis/redis';
import { publishAuthEvent } from '../../../lib/kafka';

type createSessionProps = {
  req: Request;
  userId: string;
  orgId: string;
  permissions: string[];
  ipAddress?: string;
  userAgent?: string;
  expiresInSeconds?: Date;
};
// utility function to create a session in the database.
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
// utility function to create a session in the Redis cache.
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

// utility function to save the org user callback url in the Redis cache.
const saveOrgUserCallBackUrlInRedis = async (userId: string, callbackUrl: string) => {
  logger.info('Saving org user callback url in redis.');
  await redis.set(`orgUserCallbackUrl:${userId}`, callbackUrl, {
    EX: 30 * 60, // 30 minutes
    NX: true, // Only set the key if it doesn't already exist.
  });
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
  // save the otp to the db
  const otp = generateOtp();
  await prisma.otpCode.create({
    data: {
      userId: userId,
      code: otp,
      purpose: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP expires in 10 minutes
    },
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

    // validate the request params
    const validatedParams = orgUserAuthCallbackUrlParamSchema.safeParse(req.params);
    if (!validatedParams.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request params', {
        issues: validatedParams.error.issues,
      });
    }

    // validate the request body
    const validatedBody = orgUserRegisterSchema.safeParse(req.body);
    if (!validatedBody.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request body', {
        issues: validatedBody.error.issues,
      });
    }

    // check if the user already exists
    // (one user can be a member of multiple organizations)
    const { existingUser, existingUserAccount } = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: validatedBody.data.email },
      });
      if (!existingUser) {
        throw new Error('User not found');
      }
      const existingUserAccount = await tx.account.findFirst({
        where: { userId: existingUser.id, provider: 'LOCAL', providerType: 'CREDENTIAL' },
      });

      return { existingUser, existingUserAccount };
    });

    // if user already exists, add him/her to the organization
    // assume email is already verified.
    if (existingUser && existingUserAccount) {
      // check if the user is already a member of the organization
      // if yes, just update the data or create a new membership record
      await prisma.membership.upsert({
        where: {
          userId_organizationId: {
            userId: existingUser.id,
            organizationId: orgId,
          },
        },
        update: {
          userId: existingUser.id,
          organizationId: orgId,
          role: 'MEMBER',
          permissions: JSON.stringify([]),
        },
        create: {
          userId: existingUser.id,
          organizationId: orgId,
          role: 'MEMBER',
          permissions: JSON.stringify([]),
        },
      });

      // generate the token and the session to db and redis
      const { sessionToken, dbSessionRecord } = await createSessionInDb({
        req: req,
        orgId: req.org.id!,
        userId: existingUser.id,
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
            id: existingUser.id,
            emailVerified: existingUser.emailVerified,
          },
          org: {
            id: req.org.id!,
            permissions: JSON.stringify([]),
            isBanned: false,
            role: 'MEMBER',
          },
          account: {
            id: existingUserAccount.id,
            userId: existingUser.id,
            accountId: existingUserAccount.accountId,
            provider: 'LOCAL',
            providerType: 'CREDENTIAL',
          },
        },
      });

      // check if user email is verified
      if (!existingUser.emailVerified) {
        // save the callback url in redis
        await saveOrgUserCallBackUrlInRedis(existingUser.id, validatedParams.data.callbackUrl);
        // send email verification
        await generateSaveAndSendmailVerification({
          userId: existingUser.id,
          email: existingUser.email,
        });
        // return success response
        return OKResponse(
          res,
          StatusCodes.OK,
          'User registered successfully - email verification pending.',
        );
      }
      // redirect to the callback url
      const callbackUrl = new URL(`${validatedParams.data.callbackUrl}?token=${sessionToken}`);
      return res.redirect(callbackUrl.toString());
    }

    // if user doesn't exist, create a new user and add him/her to the organization and to zentry central users table.
    const { newUser, newAccount } = await prisma.$transaction(async (tx) => {
      // hash the password
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
          hashedPassword: hashedPassword,
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

    // generate the token and the session to db and redis
    const { sessionToken, dbSessionRecord } = await createSessionInDb({
      req: req,
      orgId: req.org.id!,
      userId: newUser.id,
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
          id: newUser.id,
          emailVerified: newUser.emailVerified,
        },
        org: {
          id: req.org.id!,
          permissions: JSON.stringify([]),
          isBanned: false,
          role: 'MEMBER',
        },
        account: {
          id: newAccount.id,
          userId: newUser.id,
          accountId: newAccount.accountId,
          provider: 'LOCAL',
          providerType: 'CREDENTIAL',
        },
      },
    });
    // save the callback url in redis
    await saveOrgUserCallBackUrlInRedis(newUser.id, validatedParams.data.callbackUrl);
    // send email verification
    await generateSaveAndSendmailVerification({
      userId: newUser.id,
      email: newUser.email,
    });
    // return success response
    return OKResponse(
      res,
      StatusCodes.OK,
      'User registered successfully - email verification pending.',
    );
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
