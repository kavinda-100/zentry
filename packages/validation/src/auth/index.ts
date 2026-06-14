import { z } from 'zod';

const ProviderEnum = z.enum(['CREDENTIAL', 'OAUTH']);
const RoleEnum = z.enum(['ADMIN', 'MEMBER']);

export const sessionObjectSchema = z.object({
  sessionId: z.string({ error: 'Session ID is required' }),
  ipAddress: z.string({ error: 'IP address must be a string' }).optional(),
  user: z.object({
    id: z.string({ error: 'User ID is required' }),
    emailVerified: z.boolean({ error: 'Email verified must be a boolean' }),
    // is2FAEnabled: z.boolean({ error: 'is2FAEnabled must be a boolean' }),
  }),
  account: z.object({
    id: z.string({ error: 'Account ID is required' }),
    userId: z.string({ error: 'User ID is required' }),
    accountId: z.string({ error: 'Account ID is required' }),
    providerType: ProviderEnum,
  }),
  org: z.object({
    id: z.string({ error: 'Org ID must be a string' }).optional(),
    permissions: z.string({ error: 'Permissions must be a string' }).optional(),
    isBanned: z.boolean({ error: 'isBanned must be a boolean' }).optional(),
    role: RoleEnum.optional(),
  }),
});

export const registerSchema = z.object({
  email: z.email({ error: 'Invalid email' }),
  firstName: z.string({ error: 'First name is required' }).min(3, {
    error: 'First name must be at least 3 characters',
  }),
  lastName: z
    .string({ error: 'Last name is required' })
    .min(3, { error: 'Last name must be at least 3 characters' }),
  imageUrl: z.url({ error: 'Invalid URL' }).optional(),
  password: z
    .string({ error: 'Password is required' })
    .min(6, { error: 'Password must be at least 6 characters' })
    .max(12, { error: 'Password must be at most 12 characters' }),
});

export const loginSchema = z.object({
  email: z.email({ error: 'Invalid email' }),
  password: z.string({ error: 'Password is required' }),
});

export const verifyEmailSchema = z
  .object({
    email: z.email({ error: 'Invalid email' }),
    otp: z
      .string({ error: 'OTP is required' })
      .min(6, { error: 'OTP must be at least 6 characters' })
      .max(6, { error: 'OTP must be at most 6 characters' }),
  })
  .refine(
    (data) => {
      return !isNaN(Number(data.otp)); // Ensure OTP is a number
    },
    { message: 'Invalid OTP' },
  );

export type SessionObjectSchemaType = z.infer<typeof sessionObjectSchema>;
export type ProviderEnumType = z.infer<typeof ProviderEnum>;
export type RoleEnumType = z.infer<typeof RoleEnum>;
export type RegisterSchemaType = z.infer<typeof registerSchema>;
export type LoginSchemaType = z.infer<typeof loginSchema>;
export type VerifyEmailSchemaType = z.infer<typeof verifyEmailSchema>;
