import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { StatusCodes } from '../../utils/statusCodes';
import { ErrorResponse, OKResponse } from '../../utils/responseHandles';
import { prisma } from '@zentry/database';
import { registerSchema, loginSchema } from '@zentry/validation/src/auth';
import { formatZodIssues } from '@zentry/validation/src/utils/zod';
import {
  generateOtp,
  generateSessionToken,
  hashPassword,
  verifyPassword,
} from '../../utils/crypto';
import {
  createAuthSessionInTheRedis,
  deleteAuthSessionFromRedis,
} from '../../lib/redis/auth.redis';
import { DEFAULT_SESSION_EXPIRY_IN_SECONDS, SESSION_TOKEN_COOKIE_NAME } from '../../constants';
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
    logger.info('Creating session in the database.');
    const dbSessionRecord = await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(DEFAULT_SESSION_EXPIRY_IN_SECONDS),
        organizationId: undefined,
        permissions: undefined,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || 'unknown',
      },
    });

    // save the session in the Redis cache
    await createAuthSessionInTheRedis({
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
    res.cookie(SESSION_TOKEN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: DEFAULT_SESSION_EXPIRY_IN_SECONDS * 1000,
    });

    // save the otp to the db
    const otp = generateOtp();
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code: otp,
        purpose: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // OTP expires in 10 minutes
      },
    });

    // send Kafka message to send email verification
    await publishAuthEvent({
      type: 'EMAIL_VERIFICATION',
      userId: user.id,
      payload: {
        otp: otp,
        to: user.email,
      },
    });

    const resBody = {
      session: {
        token: sessionToken,
      },
    };
    OKResponse(res, StatusCodes.CREATED, 'User registered successfully', resBody);
  } catch (e) {
    next(e);
  }
};

/**
 * @description The standard login flow for a user (not for organization users).
 * This will authenticate the user and return a session token for the user to use in later in the requests.
 * */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Login auth route hit');

    // validate the request body
    const validatedBody = loginSchema.safeParse(req.body);
    if (!validatedBody.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request body', {
        issues: formatZodIssues(validatedBody.error.issues),
      });
    }

    // find the user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedBody.data.email },
    });
    if (!user) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
    }

    // check if the user has already verified their email
    if (!user.emailVerified) {
      return ErrorResponse(res, StatusCodes.FORBIDDEN, 'Email not verified');
    }

    // find the user's account'
    const account = await prisma.account.findFirst({
      where: { userId: user.id },
    });
    if (!account) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'User account not found');
    }
    // if user auth provider is not CREDENTIAL, return error
    if (account.providerType !== 'CREDENTIAL' || account.hashedPassword === null) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Wrong authentication method');
    }

    // check if the password is correct
    const isPasswordCorrect = verifyPassword(validatedBody.data.password, account.hashedPassword);

    if (!isPasswordCorrect) {
      return ErrorResponse(res, StatusCodes.UNAUTHORIZED, 'Invalid credentials');
    }

    // delete the user's previous sessions
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    const loginSessionToken = generateSessionToken();

    // save the session in the database
    logger.info('Creating session in the database.');
    const dbSessionRecord = await prisma.session.create({
      data: {
        userId: user.id,
        token: loginSessionToken,
        expiresAt: new Date(DEFAULT_SESSION_EXPIRY_IN_SECONDS),
        organizationId: undefined,
        permissions: undefined,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || 'unknown',
      },
    });

    // save the session in the Redis cache
    await createAuthSessionInTheRedis({
      token: loginSessionToken,
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
    res.cookie(SESSION_TOKEN_COOKIE_NAME, loginSessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: DEFAULT_SESSION_EXPIRY_IN_SECONDS * 1000,
    });

    const resBody = {
      session: {
        token: loginSessionToken,
      },
    };

    OKResponse(res, StatusCodes.OK, 'User logged in successfully', resBody);
  } catch (e) {
    next(e);
  }
};

/**
 * @description This function is used to log out the user by deleting their session from the database and Redis cache.
 * */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Logout auth route hit');

    // delete the user's previous sessions
    await prisma.session.deleteMany({
      where: { userId: req.user.id },
    });

    // delete token from redis cache
    await deleteAuthSessionFromRedis({ token: req.token });

    // clear the session cookie
    res.clearCookie(SESSION_TOKEN_COOKIE_NAME);

    OKResponse(res, StatusCodes.OK, 'User logged out successfully');
  } catch (e) {
    next(e);
  }
};

/**
 * @description This function is used to get the user's details including their accounts, organizations, and memberships.'
 * */
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Get me auth route hit');
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        accounts: true,
        organizations: true,
        memberships: true,
      },
    });
    if (!user) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
    }

    OKResponse(res, StatusCodes.OK, 'User details', user);
  } catch (e) {
    next(e);
  }
};
