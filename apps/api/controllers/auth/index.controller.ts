import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { StatusCodes } from '../../utils/statusCodes';
import { ErrorResponse, OKResponse } from '../../utils/responseHandles';
import { prisma } from '@zentry/database';
import { registerSchema } from '@zentry/validation/src/auth';
import { formatZodIssues } from '@zentry/validation/src/utils/zod';
import { generateOtp, generateSessionToken, hashPassword } from '../../utils/crypto';
import { createSessionInTheDatabase, createSessionInTheRedis } from './utils';
import { DEFAULT_SESSION_EXPIRY_IN_SECONDS } from '../../constants';
import { publishAuthEvent } from '../../lib/kafka';

/**
 * @description The standard registration flow for a user (not for organization users).
 * This will create a new user and account in the database and return a session token for the user to use in later in the requests.
 * */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Register auth route hit');

    // validate the request body
    const validatedBody = registerSchema.safeParse(req.body);
    if (!validatedBody.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request body', {
        issues: formatZodIssues(validatedBody.error.issues),
      });
    }

    // check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedBody.data.email },
    });
    if (existingUser) {
      return ErrorResponse(res, StatusCodes.CONFLICT, 'User already exists');
    }

    // hash the password
    const hashedPassword = await hashPassword(validatedBody.data.password);

    // create the new user
    const { user, account } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: validatedBody.data.email,
          firstName: validatedBody.data.firstName,
          lastName: validatedBody.data.lastName,
          imageUrl: validatedBody.data.imageUrl,
          emailVerified: false,
        },
      });
      const account = await tx.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          hashedPassword: hashedPassword,
          providerType: 'CREDENTIAL',
        },
      });

      return { user, account };
    });

    const sessionToken = generateSessionToken();

    // save the session in the database
    const dbSessionRecord = await createSessionInTheDatabase({
      userId: user.id,
      token: sessionToken,
      expiresAt: new Date(DEFAULT_SESSION_EXPIRY_IN_SECONDS),
      organizationId: undefined,
      permissions: undefined,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    // save the session in the Redis cache
    await createSessionInTheRedis({
      token: sessionToken,
      expiresInSeconds: DEFAULT_SESSION_EXPIRY_IN_SECONDS,
      sessionObject: {
        sessionId: dbSessionRecord.id,
        ipAddress: req.ip,
        user: {
          id: user.id,
          emailVerified: user.emailVerified,
        },
        account: {
          id: account.id,
          userId: user.id,
          accountId: user.id,
          providerType: account.providerType,
        },
        org: {
          id: undefined,
          permissions: undefined,
          isBanned: undefined,
        },
      },
    });

    // set the session cookie for web clients,
    // (mobile clients should store the session token in secure storage and send it in the Authorization header)
    // e.g.: - Authorization: Bearer <session_token>
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: DEFAULT_SESSION_EXPIRY_IN_SECONDS * 1000,
    });

    // send Kafka message to send email verification
    await publishAuthEvent({
      type: 'EMAIL_VERIFICATION',
      userId: user.id,
      payload: {
        otp: generateOtp(),
        to: user.email,
      },
    });

    const resBody = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        emailVerified: user.emailVerified,
      },
      account: {
        id: account.id,
        accountId: account.accountId,
        providerType: account.providerType,
      },
      session: {
        token: sessionToken,
      },
    };
    OKResponse(res, StatusCodes.CREATED, 'User registered successfully', resBody);
  } catch (e) {
    next(e);
  }
};

export const login = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Login route hit with body:', req.body);
    res.status(200).json({ message: 'Scaffold login route hit safely.' });
  } catch (e) {
    next(e);
  }
};
