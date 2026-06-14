import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { StatusCodes } from '../../utils/statusCodes';
import { ErrorResponse, OKResponse } from '../../utils/responseHandles';
import { prisma } from '@zentry/database';
import { verifyEmailSchema } from '@zentry/validation/src/auth';
import { formatZodIssues } from '@zentry/validation/src/utils/zod';
import { updateAuthSessionInRedis } from '../../lib/redis/auth.redis';

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Verify email route hit');

    // validate the request body
    const validatedBody = verifyEmailSchema.safeParse(req.body);
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
    if (user.emailVerified) {
      return OKResponse(res, StatusCodes.OK, 'Email already verified', null);
    }

    // find the otp code
    const otpCode = await prisma.otpCode.findFirst({
      where: { userId: user.id, purpose: 'EMAIL_VERIFICATION', code: validatedBody.data.otp },
    });
    if (!otpCode) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid OTP');
    }

    // check if the otp code has expired
    if (otpCode.expiresAt < new Date()) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'OTP has expired');
    }

    // mark the user's email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // update the session redis cache
    const isUpdated = await updateAuthSessionInRedis({
      token: req.token,
      updates: {
        user: { emailVerified: true },
      },
    });
    if (!isUpdated) {
      // to ignore the error, the session must be continued to work
      logger.debug('Failed to update session in Redis cache.');
    }

    // delete the otp code
    await prisma.otpCode.delete({
      where: { id: otpCode.id },
    });

    OKResponse(res, StatusCodes.OK, 'Email verified successfully', null);
  } catch (e) {
    next(e);
  }
};
