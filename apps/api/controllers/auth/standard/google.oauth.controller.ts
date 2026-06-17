import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../../utils/logger';
import { getGoogleAuthUrl, getGoogleUserInfo } from '../../../lib/OAuth/google';
import { ErrorResponse } from '../../../utils/responseHandles';
import { StatusCodes } from '../../../utils/statusCodes';
import { GoogleOAuthResultSchema } from '@zentry/validation/src/auth/oAuth/google';
import { formatZodIssues } from '@zentry/validation/src/utils/zod';
import { prisma } from '@zentry/database';
import { generateSessionToken } from '../../../utils/crypto';
import { DEFAULT_SESSION_EXPIRY_IN_SECONDS, SESSION_TOKEN_COOKIE_NAME } from '../../../constants';
import { createAuthSessionInTheRedis } from '../../../lib/redis/auth.redis';

/**
 * @description This function is used to redirect the user to the Google consent page for OAuth authentication.
 * only for standard users (not for organization users)
 * */
export const googleOauth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Google Oauth route hit');

    // Read the callback target from query params (e.g., /api/auth/google?callbackUrl=http://localhost:3000/dashboard)
    // Defaulting to localhost:3000 if none is supplied to prevent empty routing drops
    const targetRedirectUrl = (req.query.callbackUrl as string) || 'http://localhost:3000';

    logger.debug({ targetRedirectUrl }, 'Forwarding UI target path into OAuth state matrix');

    // Pass the destination URL into the state parameter
    const url = getGoogleAuthUrl(targetRedirectUrl);

    // redirect the user to the Google consent page
    res.redirect(url);
  } catch (e) {
    next(e);
  }
};

/**
 * @description This function is used to handle the OAuth callback from Google after the user has granted access.
 * only for standard users (not for organization users)
 * */
export const googleOauthCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Google Oauth callback route hit');

    // get the code from the query parameters
    const code = req.query.code as string;

    // Extract the target destination string passed back to us by Google
    const clientRedirectUrl = (req.query.state as string) || 'http://localhost:3000';

    if (!code || typeof code !== 'string') {
      const requestQuery = JSON.stringify(req.query);
      logger.debug({ requestQuery }, 'No code found in the query parameters');
      return ErrorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Internal server error');
    }

    // get user info from Google
    const googleUserInfoPayload = await getGoogleUserInfo(code);
    logger.debug({ userInfo: googleUserInfoPayload }, 'Google user info retrieved successfully');
    // validate the user info
    const validatedGoogleUserInfo = GoogleOAuthResultSchema.safeParse(googleUserInfoPayload);
    if (!validatedGoogleUserInfo.success) {
      logger.error(
        {
          issues: formatZodIssues(validatedGoogleUserInfo.error.issues),
        },
        'Invalid Google user info',
      );
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid Google user info', {
        issues: formatZodIssues(validatedGoogleUserInfo.error.issues),
      });
    }

    const { profile, tokens } = validatedGoogleUserInfo.data;

    const { user, account } = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: profile.email },
      });

      const user = existingUser
        ? await tx.user.update({
            where: { id: existingUser.id },
            data: {
              emailVerified: existingUser.emailVerified || profile.email_verified,
              firstName:
                existingUser.firstName || profile.given_name || profile.name || 'GoogleUser',
              lastName:
                existingUser.lastName || profile.family_name || profile.name || 'GoogleUser',
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
        throw new Error('Google account is already linked to a different user');
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

      return { user, account };
    });

    const sessionToken = generateSessionToken();

    // save the session in the database
    logger.info('Creating session in the database.');
    const dbSessionRecord = await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + DEFAULT_SESSION_EXPIRY_IN_SECONDS * 1000),
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
          accountId: account.accountId,
          provider: account.provider,
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

    // Safely append the token payload to the redirect URL
    const targetUrl = new URL(clientRedirectUrl);
    targetUrl.searchParams.set('token', sessionToken);

    logger.info({ redirectTarget: targetUrl.toString() }, 'Redirecting to UI with session payload');

    // Perform the redirect
    return res.redirect(targetUrl.toString());
  } catch (e) {
    next(e);
  }
};
