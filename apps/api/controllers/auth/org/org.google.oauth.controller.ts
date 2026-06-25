import type { NextFunction, Request, Response } from 'express';
import { prisma } from '@zentry/database';
import { formatZodIssues, orgUserAuthCallbackUrlQuerySchema } from '@zentry/validation';
import {
  GoogleProfileSchema,
  type GoogleProfileType,
  GoogleTokensSchema,
  type GoogleTokensType,
} from '@zentry/validation/src/auth/oAuth/google';
import { logger } from '../../../utils/logger';
import { ErrorResponse } from '../../../utils/responseHandles';
import { StatusCodes } from '../../../utils/statusCodes';
import { getOrgGoogleAuthUrl, getOrgGoogleUserInfo } from '../../../lib/OAuth/org.google';
import {
  createReadyForRedirectResponse,
  deleteOrgSessions,
  validateOrgAuthRequestQuery,
  validateOrgCallbackUrl,
} from './shared';

type EncodedOrgGoogleState = {
  orgId: string;
  callbackUrl: string;
  state: string;
};

class OrgGoogleOauthFlowError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * @description Packs org callback context into Google's state round-trip payload.
 */
const encodeOrgGoogleState = (payload: EncodedOrgGoogleState) => {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
};

/**
 * @description Restores and validates the org callback context returned by Google.
 */
const decodeOrgGoogleState = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) {
    return {
      success: false as const,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Google callback state is required.',
    };
  }

  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {
        success: false as const,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Google callback state is invalid.',
      };
    }

    const record = parsed as Record<string, unknown>;
    const validatedQuery = orgUserAuthCallbackUrlQuerySchema.safeParse({
      callbackUrl: record.callbackUrl,
      state: record.state,
    });

    if (!validatedQuery.success) {
      return {
        success: false as const,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Google callback state is invalid.',
        issues: formatZodIssues(validatedQuery.error.issues),
      };
    }

    if (typeof record.orgId !== 'string' || record.orgId.trim().length === 0) {
      return {
        success: false as const,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Google callback state is missing the organization id.',
      };
    }

    return {
      success: true as const,
      data: {
        orgId: record.orgId,
        callbackUrl: validatedQuery.data.callbackUrl,
        state: validatedQuery.data.state,
      },
    };
  } catch (error) {
    logger.warn({ error }, 'Failed to decode org Google callback state.');
    return {
      success: false as const,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Google callback state is invalid.',
    };
  }
};

/**
 * @description Appends the SDK callback payload to the validated organization callback URL.
 */
const buildOrgSdkRedirectUrl = ({
  callbackUrl,
  code,
  state,
}: {
  callbackUrl: string;
  code: string;
  state: string;
}) => {
  const redirectUrl = new URL(callbackUrl);
  redirectUrl.searchParams.set('code', code);
  redirectUrl.searchParams.set('state', state);
  return redirectUrl.toString();
};

/**
 * @description Upserts the Google-backed user, account, and org membership for the org auth flow.
 */
const provisionOrgGoogleActor = async ({
  orgId,
  profile,
  tokens,
}: {
  orgId: string;
  profile: GoogleProfileType;
  tokens: GoogleTokensType;
}) => {
  return prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email: profile.email },
    });

    const user = existingUser
      ? await tx.user.update({
          where: { id: existingUser.id },
          data: {
            emailVerified: existingUser.emailVerified || profile.email_verified,
            firstName: existingUser.firstName || profile.given_name || profile.name || 'GoogleUser',
            lastName: existingUser.lastName || profile.family_name || profile.name || 'GoogleUser',
            imageUrl: existingUser.imageUrl ?? profile.picture,
          },
        })
      : await tx.user.create({
          data: {
            email: profile.email,
            firstName: profile.given_name || profile.name || 'GoogleUser',
            lastName: profile.family_name || profile.name || 'GoogleUser',
            imageUrl: profile.picture,
            emailVerified: profile.email_verified,
          },
        });

    const existingGoogleAccount = await tx.account.findUnique({
      where: {
        provider_accountId: {
          provider: 'GOOGLE',
          accountId: profile.sub,
        },
      },
    });

    if (existingGoogleAccount && existingGoogleAccount.userId !== user.id) {
      logger.warn(
        {
          googleAccountUserId: existingGoogleAccount.userId,
          emailUserId: user.id,
          email: profile.email,
        },
        'Google account is already linked to a different user',
      );
      throw new OrgGoogleOauthFlowError(
        StatusCodes.CONFLICT,
        'Google account is already linked to a different user.',
      );
    }

    const account = existingGoogleAccount
      ? await tx.account.update({
          where: { id: existingGoogleAccount.id },
          data: {
            providerType: 'OAUTH',
            providerEmail: profile.email,
            providerDisplayName: profile.name,
            providerAvatarUrl: profile.picture,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? existingGoogleAccount.refreshToken,
            accessTokenExpiresAt: new Date(tokens.expiry_date),
            refreshTokenExpiresAt: null,
            scope: tokens.scope,
            idToken: tokens.id_token,
            hashedPassword: null,
          },
        })
      : await tx.account.create({
          data: {
            userId: user.id,
            provider: 'GOOGLE',
            accountId: profile.sub,
            providerType: 'OAUTH',
            providerEmail: profile.email,
            providerDisplayName: profile.name,
            providerAvatarUrl: profile.picture,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            accessTokenExpiresAt: new Date(tokens.expiry_date),
            refreshTokenExpiresAt: null,
            scope: tokens.scope,
            idToken: tokens.id_token,
          },
        });

    const membership = await tx.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
    });

    if (membership?.isBanned) {
      throw new OrgGoogleOauthFlowError(
        StatusCodes.FORBIDDEN,
        'You are not allowed to access this organization.',
      );
    }

    await tx.membership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: orgId,
        },
      },
      update: {
        role: membership?.role ?? 'MEMBER',
        isBanned: false,
        permissions: membership?.permissions ?? JSON.stringify([]),
      },
      create: {
        userId: user.id,
        organizationId: orgId,
        role: 'MEMBER',
        permissions: JSON.stringify([]),
      },
    });

    return { user, account };
  });
};

/**
 * @description Redirects org users to the org-specific Google consent flow.
 */
export const orgGoogleOauth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Org Google OAuth route hit');

    const validatedRequest = await validateOrgAuthRequestQuery(req, res);
    if (!validatedRequest) {
      return;
    }

    const url = getOrgGoogleAuthUrl(
      encodeOrgGoogleState({
        orgId: validatedRequest.orgId,
        callbackUrl: validatedRequest.query.callbackUrl,
        state: validatedRequest.query.state,
      }),
    );

    res.redirect(url);
  } catch (error) {
    next(error);
  }
};

/**
 * @description Handles org Google login and registration in one callback path.
 */
export const orgGoogleOauthCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Org Google OAuth callback route hit');

    const code = req.query.code;
    if (typeof code !== 'string' || code.length === 0) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Google authorization code is required.');
    }

    const decodedState = decodeOrgGoogleState(req.query.state);
    if (!decodedState.success) {
      return ErrorResponse(res, decodedState.statusCode, decodedState.message, {
        ...(decodedState.issues ? { issues: decodedState.issues } : {}),
      });
    }

    const callbackValidation = await validateOrgCallbackUrl(
      decodedState.data.orgId,
      decodedState.data.callbackUrl,
    );
    if (!callbackValidation.success) {
      return ErrorResponse(res, callbackValidation.statusCode, callbackValidation.message);
    }

    const googleUserInfoPayload = await getOrgGoogleUserInfo(code);
    logger.debug({ userInfo: googleUserInfoPayload.profile }, 'Org Google user info retrieved.');

    const validatedProfile = GoogleProfileSchema.safeParse(googleUserInfoPayload.profile);
    if (!validatedProfile.success) {
      logger.error(
        {
          issues: formatZodIssues(validatedProfile.error.issues),
        },
        'Invalid Google user profile',
      );
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid Google user profile', {
        issues: formatZodIssues(validatedProfile.error.issues),
      });
    }

    const validatedTokens = GoogleTokensSchema.safeParse(googleUserInfoPayload.tokens);
    if (!validatedTokens.success) {
      logger.error(
        {
          issues: formatZodIssues(validatedTokens.error.issues),
        },
        'Invalid Google OAuth tokens',
      );
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid Google OAuth tokens', {
        issues: formatZodIssues(validatedTokens.error.issues),
      });
    }

    const { user } = await provisionOrgGoogleActor({
      orgId: decodedState.data.orgId,
      profile: validatedProfile.data,
      tokens: validatedTokens.data,
    });

    await deleteOrgSessions(user.id, decodedState.data.orgId);

    const redirectPayload = await createReadyForRedirectResponse({
      userId: user.id,
      orgId: decodedState.data.orgId,
      callbackUrl: decodedState.data.callbackUrl,
      state: decodedState.data.state,
    });

    return res.redirect(
      buildOrgSdkRedirectUrl({
        callbackUrl: redirectPayload.callbackUrl,
        code: redirectPayload.code,
        state: redirectPayload.state,
      }),
    );
  } catch (error) {
    if (error instanceof OrgGoogleOauthFlowError) {
      return ErrorResponse(res, error.statusCode, error.message);
    }

    next(error);
  }
};
