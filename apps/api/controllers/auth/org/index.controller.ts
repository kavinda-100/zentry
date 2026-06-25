import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { prisma } from '@zentry/database';
import {
  formatZodIssues,
  orgAuthExchangeSchema,
  orgUserLoginSchema,
  orgUserRegisterSchema,
  orgUserVerifyEmailSchema,
} from '@zentry/validation';
import { logger } from '../../../utils/logger';
import { ErrorResponse, OKResponse } from '../../../utils/responseHandles';
import { StatusCodes } from '../../../utils/statusCodes';
import { generateOtp, hashPassword, verifyPassword } from '../../../utils/crypto';
import {
  createVerificationFlowInRedis,
  consumeAuthCodeGrantFromRedis,
  deleteVerificationFlowFromRedis,
  getVerificationFlowFromRedis,
} from '../../../lib/redis/org-auth-flow.redis';
import { publishAuthEvent } from '../../../lib/kafka';
import {
  createOrgSession,
  createReadyForRedirectResponse,
  deleteOrgSessions,
  validateOrgAuthRequestQuery,
  validateOrgCallbackUrl,
} from './shared';

const EMAIL_VERIFICATION_EXPIRY_IN_SECONDS = 10 * 60;

/**
 * @description Sends and persists a fresh email verification OTP for the user.
 */
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
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_IN_SECONDS * 1000),
      },
    });
  });

  await publishAuthEvent({
    type: 'EMAIL_VERIFICATION',
    userId,
    payload: {
      otp,
      to: email,
    },
  });
};

/**
 * @description Shapes the response for users who must complete email verification first.
 */
const buildPendingVerificationResponse = ({
  verificationFlowId,
  email,
  callbackUrl,
  state,
  expiresAt,
}: {
  verificationFlowId: string;
  email: string;
  callbackUrl: string;
  state: string;
  expiresAt: Date;
}) => ({
  status: 'PENDING_EMAIL_VERIFICATION' as const,
  verificationFlowId,
  email,
  callbackUrl,
  state,
  expiresAt: expiresAt.toISOString(),
});

/**
 * @description Creates a temporary verification flow for unverified organization users.
 */
const createPendingVerificationResponse = async ({
  userId,
  orgId,
  email,
  callbackUrl,
  state,
}: {
  userId: string;
  orgId: string;
  email: string;
  callbackUrl: string;
  state: string;
}) => {
  const verificationFlowId = randomUUID();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_IN_SECONDS * 1000);

  await createVerificationFlowInRedis({
    verificationFlowId,
    expiresInSeconds: EMAIL_VERIFICATION_EXPIRY_IN_SECONDS,
    record: {
      userId,
      orgId,
      email,
      callbackUrl,
      state,
      issuedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
  });

  return buildPendingVerificationResponse({
    verificationFlowId,
    email,
    callbackUrl,
    state,
    expiresAt,
  });
};

/**
 * @description Loads the authenticated user's org-scoped session payload in the shared SDK shape.
 */
const getOrgSessionResponseBody = async (userId: string, orgId: string) => {
  const [user, account, org, membership] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
    }),
    prisma.account.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
    }),
    prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: orgId,
        },
      },
    }),
  ]);

  if (!user) {
    return {
      success: false as const,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'User not found',
    };
  }

  if (!account) {
    return {
      success: false as const,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Account not found',
    };
  }

  if (!org) {
    return {
      success: false as const,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Organization not found',
    };
  }

  if (!membership || membership.isBanned) {
    return {
      success: false as const,
      statusCode: StatusCodes.FORBIDDEN,
      message: 'You are not allowed to access this organization.',
    };
  }

  return {
    success: true as const,
    data: {
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
    },
  };
};

/**
 * @description The registration flow for an organization user.
 */
export const orgRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Org register auth route hit');

    const validatedRequest = await validateOrgAuthRequestQuery(req, res);
    if (!validatedRequest) {
      return;
    }

    const validatedBody = orgUserRegisterSchema.safeParse(req.body);
    if (!validatedBody.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request body', {
        issues: formatZodIssues(validatedBody.error.issues),
      });
    }

    const { orgId, query } = validatedRequest;
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

    if (!user.emailVerified) {
      await generateSaveAndSendmailVerification({
        userId: user.id,
        email: user.email,
      });

      const responseBody = await createPendingVerificationResponse({
        userId: user.id,
        orgId,
        email: user.email,
        callbackUrl: query.callbackUrl,
        state: query.state,
      });

      return OKResponse(
        res,
        StatusCodes.OK,
        'User registered successfully - email verification pending.',
        responseBody,
      );
    }

    const responseBody = await createReadyForRedirectResponse({
      userId: user.id,
      orgId,
      callbackUrl: query.callbackUrl,
      state: query.state,
    });

    return OKResponse(res, StatusCodes.OK, 'User registered successfully.', responseBody);
  } catch (e) {
    next(e);
  }
};

/**
 * @description Authenticates an existing LOCAL org user and starts the secure redirect flow.
 */
export const orgLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Org login auth route hit');

    const validatedRequest = await validateOrgAuthRequestQuery(req, res);
    if (!validatedRequest) {
      return;
    }

    const validatedBody = orgUserLoginSchema.safeParse(req.body);
    if (!validatedBody.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request body', {
        issues: formatZodIssues(validatedBody.error.issues),
      });
    }

    const { orgId, query } = validatedRequest;
    const user = await prisma.user.findUnique({
      where: { email: validatedBody.data.email },
    });
    if (!user) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
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

    const isPasswordCorrect = await verifyPassword(
      validatedBody.data.password,
      account.hashedPassword,
    );
    if (!isPasswordCorrect) {
      return ErrorResponse(res, StatusCodes.UNAUTHORIZED, 'Invalid credentials');
    }

    if (!user.emailVerified) {
      await generateSaveAndSendmailVerification({
        userId: user.id,
        email: user.email,
      });

      const responseBody = await createPendingVerificationResponse({
        userId: user.id,
        orgId,
        email: user.email,
        callbackUrl: query.callbackUrl,
        state: query.state,
      });

      return OKResponse(res, StatusCodes.OK, 'Email verification required.', responseBody);
    }

    const responseBody = await createReadyForRedirectResponse({
      userId: user.id,
      orgId,
      callbackUrl: query.callbackUrl,
      state: query.state,
    });

    return OKResponse(res, StatusCodes.OK, 'User logged in successfully.', responseBody);
  } catch (e) {
    next(e);
  }
};

/**
 * @description Verifies an organization user's email via a temporary verification flow.
 */
export const orgVerifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Org verify email auth route hit');

    const validatedRequest = await validateOrgAuthRequestQuery(req, res);
    if (!validatedRequest) {
      return;
    }

    const validatedBody = orgUserVerifyEmailSchema.safeParse(req.body);
    if (!validatedBody.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request body', {
        issues: formatZodIssues(validatedBody.error.issues),
      });
    }

    const { orgId, query } = validatedRequest;
    const verificationFlow = await getVerificationFlowFromRedis(
      validatedBody.data.verificationFlowId,
    );
    if (!verificationFlow) {
      return ErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        'Verification flow not found or already expired.',
      );
    }

    if (
      verificationFlow.orgId !== orgId ||
      verificationFlow.callbackUrl !== query.callbackUrl ||
      verificationFlow.state !== query.state ||
      verificationFlow.email !== validatedBody.data.email
    ) {
      return ErrorResponse(res, StatusCodes.FORBIDDEN, 'Verification flow does not match request.');
    }

    if (new Date(verificationFlow.expiresAt) < new Date()) {
      await deleteVerificationFlowFromRedis(validatedBody.data.verificationFlowId);
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Verification flow has expired.');
    }

    const user = await prisma.user.findUnique({
      where: { id: verificationFlow.userId },
    });
    if (!user) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'User not found');
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: verificationFlow.userId,
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

    if (user.emailVerified) {
      await deleteVerificationFlowFromRedis(validatedBody.data.verificationFlowId);
      const responseBody = await createReadyForRedirectResponse({
        userId: user.id,
        orgId,
        callbackUrl: query.callbackUrl,
        state: query.state,
      });

      return OKResponse(res, StatusCodes.OK, 'Email already verified.', responseBody);
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

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });

      await tx.otpCode.delete({
        where: { id: otpCode.id },
      });
    });

    await deleteVerificationFlowFromRedis(validatedBody.data.verificationFlowId);

    const responseBody = await createReadyForRedirectResponse({
      userId: user.id,
      orgId,
      callbackUrl: query.callbackUrl,
      state: query.state,
    });

    return OKResponse(res, StatusCodes.OK, 'Email verified successfully.', responseBody);
  } catch (e) {
    next(e);
  }
};

/**
 * @description Exchanges a one-time code for the final org-scoped session token.
 */
export const orgExchangeCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Org exchange code auth route hit');

    const orgId = req.org.id;
    if (!orgId) {
      return ErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'Organization not found in request context.',
      );
    }

    const validatedBody = orgAuthExchangeSchema.safeParse(req.body);
    if (!validatedBody.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request body', {
        issues: formatZodIssues(validatedBody.error.issues),
      });
    }

    const callbackValidation = await validateOrgCallbackUrl(orgId, validatedBody.data.callbackUrl);
    if (!callbackValidation.success) {
      return ErrorResponse(res, callbackValidation.statusCode, callbackValidation.message);
    }

    const grant = await consumeAuthCodeGrantFromRedis(validatedBody.data.code);
    if (!grant) {
      return ErrorResponse(
        res,
        StatusCodes.UNAUTHORIZED,
        'Code not found, expired, or already used.',
      );
    }

    if (
      grant.orgId !== orgId ||
      grant.callbackUrl !== validatedBody.data.callbackUrl ||
      grant.state !== validatedBody.data.state
    ) {
      return ErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        'Code exchange request does not match grant.',
      );
    }

    if (new Date(grant.expiresAt) < new Date()) {
      return ErrorResponse(res, StatusCodes.UNAUTHORIZED, 'Code has expired.');
    }

    const [user, account, membership] = await Promise.all([
      prisma.user.findUnique({
        where: { id: grant.userId },
      }),
      prisma.account.findFirst({
        where: {
          userId: grant.userId,
          provider: 'LOCAL',
          providerType: 'CREDENTIAL',
        },
      }),
      prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: grant.userId,
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

    if (!membership || membership.isBanned) {
      return ErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        'You are not allowed to access this organization.',
      );
    }

    if (!user.emailVerified) {
      return ErrorResponse(res, StatusCodes.FORBIDDEN, 'Email verification is still required.');
    }

    await deleteOrgSessions(user.id, orgId);

    const { sessionToken } = await createOrgSession({
      req,
      actor: {
        userId: user.id,
        emailVerified: user.emailVerified,
        accountId: account.id,
        provider: 'LOCAL',
        providerType: 'CREDENTIAL',
        accountProviderId: account.accountId,
      },
    });

    return OKResponse(res, StatusCodes.OK, 'Code exchanged successfully.', {
      session: {
        token: sessionToken,
      },
    });
  } catch (e) {
    next(e);
  }
};

/**
 * @description Logs out the authenticated org user by removing their org-scoped sessions.
 */
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

    return OKResponse(res, StatusCodes.OK, 'User logged out successfully');
  } catch (e) {
    next(e);
  }
};

/**
 * @description Returns the authenticated session in the shared SDK session shape for a specific org.
 */
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

    const sessionResponse = await getOrgSessionResponseBody(req.user.id, orgId);
    if (!sessionResponse.success) {
      return ErrorResponse(res, sessionResponse.statusCode, sessionResponse.message);
    }

    OKResponse(res, StatusCodes.OK, 'Organization session details', sessionResponse.data);
  } catch (e) {
    next(e);
  }
};
