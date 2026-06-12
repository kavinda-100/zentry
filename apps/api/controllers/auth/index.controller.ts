import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { StatusCodes } from '../../utils/statusCodes';
import { ErrorResponse, OKResponse } from '../../utils/responseHandles';
import { prisma } from '@zentry/database';
import { formatZodIssues, registerSchema } from '@zentry/validation';
import { generateSessionToken, hashPassword } from '../../utils/crypto';

/**
 * @description The standard registration flow for a user.
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

    // TODO: create a session for the user in db, redis

    //TODO: send Kafka message to send welcome email

    //TODO: send Kafka message to send email verification

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
