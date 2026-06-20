import { z } from 'zod';

export const isoDateStringSchema = z.string().min(1);

export const providerTypeSchema = z.enum(['CREDENTIAL', 'OAUTH']);
export const authProviderSchema = z.enum(['LOCAL', 'GOOGLE']);
export const roleSchema = z.enum(['ADMIN', 'MEMBER']);
export const otpPurposeSchema = z.enum(['EMAIL_VERIFICATION', 'TWO_FACTOR_AUTH', 'RESET_PASSWORD']);
export const jsonValueSchema = z.unknown();

export const userSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  emailVerified: z.boolean(),
  imageUrl: z.string().nullable(),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});

export const organizationSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  rootAdminId: z.uuid(),
  logoUrl: z.string().nullable(),
  apiKeyRow: z.string(),
  apiKeyHash: z.string(),
  apiKeyPrefix: z.string(),
  appHomeUrl: z.array(z.string()),
  appCallbackUrl: z.array(z.string()),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});

export const membershipSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  organizationId: z.uuid(),
  role: roleSchema,
  isBanned: z.boolean(),
  permissions: jsonValueSchema.nullable(),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});

export const accountSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  provider: authProviderSchema,
  accountId: z.string(),
  providerType: providerTypeSchema,
  providerEmail: z.string().nullable(),
  providerDisplayName: z.string().nullable(),
  providerAvatarUrl: z.string().nullable(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  accessTokenExpiresAt: isoDateStringSchema.nullable(),
  refreshTokenExpiresAt: isoDateStringSchema.nullable(),
  scope: z.string().nullable(),
  idToken: z.string().nullable(),
  hashedPassword: z.string().nullable(),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});

export const sessionSchema = z.object({
  id: z.uuid(),
  token: z.string(),
  expiresAt: isoDateStringSchema,
  userId: z.uuid(),
  organizationId: z.uuid().nullable(),
  permissions: jsonValueSchema.nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});

export const otpCodeSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  purpose: otpPurposeSchema,
  expiresAt: isoDateStringSchema,
  userId: z.uuid(),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});
