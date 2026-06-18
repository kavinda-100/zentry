import { z } from 'zod';
import { isoDateStringSchema } from '#/zod';

const authProviderSchema = z.enum(['LOCAL', 'GOOGLE']);
const providerTypeSchema = z.enum(['CREDENTIAL', 'OAUTH']);
const roleSchema = z.enum(['ADMIN', 'MEMBER']);
const jsonValueSchema = z.unknown();

export const authSessionDataSchema = z.object({
  session: z.object({
    token: z.string().min(1),
  }),
});

export const meAccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
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

export const meOrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  rootAdminId: z.string(),
  logoUrl: z.string().nullable(),
  apiKeyRow: z.string(),
  apiKeyHash: z.string(),
  apiKeyPrefix: z.string(),
  appHomeUrl: z.array(z.string()),
  appCallbackUrl: z.array(z.string()),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});

export const meMembershipSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  role: roleSchema,
  isBanned: z.boolean(),
  permissions: jsonValueSchema.nullable(),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});

export const meUserDataSchema = z.object({
  id: z.string(),
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  emailVerified: z.boolean(),
  imageUrl: z.string().nullable(),
  accounts: z.array(meAccountSchema),
  organizations: z.array(meOrganizationSchema),
  memberships: z.array(meMembershipSchema),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});

export const emptyResponseDataSchema = z.null();
