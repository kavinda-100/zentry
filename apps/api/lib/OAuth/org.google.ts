import { OAuth2Client } from 'google-auth-library';
import { env } from '../env';
import { logger } from '../../utils/logger';

// Initialize the official Google authentication client wire configuration
export const orgGoogleOAuth2Client = new OAuth2Client(
  env.GOOGLE_CLIENT_ID_ORG,
  env.GOOGLE_CLIENT_SECRET_ORG,
  env.GOOGLE_REDIRECT_URI_ORG,
);

/**
 * Generates a secure Google Consent Screen URL for the frontend redirection boundary.
 */
export const getOrgGoogleAuthUrl = (state?: string): string => {
  return orgGoogleOAuth2Client.generateAuthUrl({
    access_type: 'offline', // Requests a refresh_token for extended backend sessions
    // scope: [
    //   'https://www.googleapis.com/auth/userinfo.profile',
    //   'https://www.googleapis.com/auth/userinfo.email',
    // ],
    scope: ['openid', 'email', 'profile'],
    prompt: 'consent',
    state,
  });
};

/**
 * Exposes profile information by exchanging the callback authorization code.
 */
export const getOrgGoogleUserInfo = async (code: string) => {
  // Exchange the single-use auth code for valid tokens
  const { tokens } = await orgGoogleOAuth2Client.getToken(code);

  if (!tokens.id_token) {
    logger.error('No ID token found in the response');
    throw new Error('No ID token found in the response');
  }

  const ticket = await orgGoogleOAuth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.GOOGLE_CLIENT_ID_ORG,
  });

  const payload = ticket.getPayload();
  return {
    profile: payload,
    tokens,
  };
};
