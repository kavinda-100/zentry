import { OAuth2Client } from 'google-auth-library';
import { env } from '../env';
import { logger } from '../../utils/logger';

// Initialize the official Google authentication client wire configuration
export const googleOAuth2Client = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI,
);

/**
 * Generates a secure Google Consent Screen URL for the frontend redirection boundary.
 */
export const getGoogleAuthUrl = (): string => {
  return googleOAuth2Client.generateAuthUrl({
    access_type: 'offline', // Requests a refresh_token for extended backend sessions
    // scope: [
    //   'https://www.googleapis.com/auth/userinfo.profile',
    //   'https://www.googleapis.com/auth/userinfo.email',
    // ],
    scope: ['openid', 'email', 'profile'],
    prompt: 'consent',
  });
};

/**
 * Exposes profile information by exchanging the callback authorization code.
 */
export const getGoogleUserInfo = async (code: string) => {
  // Exchange the single-use auth code for valid tokens
  const { tokens } = await googleOAuth2Client.getToken(code);

  if (!tokens.id_token) {
    logger.error('No ID token found in the response');
    throw new Error('No ID token found in the response');
  }

  const ticket = await googleOAuth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  return {
    profile: payload,
    tokens,
  };
};

// ------------------- old version ---------------------
// export const getGoogleUserInfo = async (code: string) => {
//   // 1. Exchange the single-use auth code for valid tokens
//   const { tokens } = await googleOAuth2Client.getToken(code);
//   googleOAuth2Client.setCredentials(tokens);
//
//   // 2. Fetch the validated profile payload using the authenticated client wire
//   const response = await googleOAuth2Client.request<{
//     id: string;
//     email: string;
//     verified_email: boolean;
//     name: string;
//     picture: string;
//     given_name: string;
//     family_name: string;
//   }>({
//     url: 'https://www.googleapis.com/oauth2/v2/userinfo',
//   });
//
//   return {
//     profile: response.data,
//     tokens,
//   };
// };
