import { z } from 'zod';

export const GoogleProfileSchema = z.object({
  iss: z.url({ message: 'Profile iss must be a valid Google issuer URL.' }),
  azp: z.string().min(1, { message: 'Authorized party (azp) string is missing.' }),
  aud: z.string().min(1, { message: 'Audience (aud) client identifier string is missing.' }),
  sub: z.string().min(1, { message: 'Google Subject unique identifier (sub) is missing.' }),
  email: z.email({ message: 'Profile email must be a valid formatted email address.' }),
  email_verified: z.boolean({
    error: 'email_verified state boolean flag from Google is required.',
  }),
  at_hash: z.string().min(1, { message: 'Access token hash string is missing.' }),
  name: z.string().min(1, { message: 'User display name string is missing.' }),
  picture: z.url({ message: 'Profile picture avatar link must be a valid URL.' }),
  given_name: z.string().min(1, { message: 'Given name string is missing.' }),
  family_name: z.string().default(''), // Defaulted to an empty string to safeguard users without last names
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
});

export const GoogleTokensSchema = z.object({
  access_token: z.string().min(1, { message: 'Access token string is empty or missing.' }),
  refresh_token: z.string().optional(), // Marked optional because Google only returns this on the first initial consent setup
  scope: z.string().min(1, { message: 'Token permission scopes are missing.' }),
  token_type: z.literal('Bearer', {
    error: 'Invalid token type wrapper. Zentry only accepts Bearer signatures.',
  }),
  id_token: z.string().min(1, { message: 'Identity JWT string (id_token) is missing.' }),
  expiry_date: z
    .number()
    .int()
    .positive({ message: 'Token expiration timestamp must be a valid epoch millisecond integer.' }),
});

export const GoogleOAuthResultSchema = z.object({
  profile: GoogleProfileSchema,
  tokens: GoogleTokensSchema,
});

export type GoogleProfileType = z.infer<typeof GoogleProfileSchema>;
export type GoogleTokensType = z.infer<typeof GoogleTokensSchema>;
export type GoogleOAuthResultType = z.infer<typeof GoogleOAuthResultSchema>;
