import { z } from 'zod';

export const orgUserAuthCallbackUrlQuerySchema = z.object({
  callbackUrl: z.url({ error: 'Callback URL is required' }),
  state: z.string({ error: 'State is required' }).min(16, {
    error: 'State must be at least 16 characters',
  }),
});

export const orgUserRegisterSchema = z.object({
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

export const orgUserLoginSchema = z.object({
  email: z.email({ error: 'Invalid email' }),
  password: z.string({ error: 'Password is required' }),
});

export const orgUserVerifyEmailSchema = z
  .object({
    verificationFlowId: z.uuid({ error: 'Verification flow ID is required' }),
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

export const orgAuthPendingVerificationResponseSchema = z.object({
  status: z.literal('PENDING_EMAIL_VERIFICATION'),
  verificationFlowId: z.uuid(),
  email: z.email(),
  callbackUrl: z.url(),
  state: z.string().min(16),
  expiresAt: z.string().datetime(),
});

export const orgAuthRedirectReadyResponseSchema = z.object({
  status: z.literal('READY_FOR_REDIRECT'),
  code: z.string().min(1),
  callbackUrl: z.url(),
  state: z.string().min(16),
  expiresAt: z.string().datetime(),
});

export const orgAuthFlowResponseSchema = z.discriminatedUnion('status', [
  orgAuthPendingVerificationResponseSchema,
  orgAuthRedirectReadyResponseSchema,
]);

export const orgAuthExchangeSchema = z.object({
  code: z.string({ error: 'Code is required' }).min(1),
  callbackUrl: z.url({ error: 'Callback URL is required' }),
  state: z.string({ error: 'State is required' }).min(16, {
    error: 'State must be at least 16 characters',
  }),
});

export const orgSdkCallbackQuerySchema = z.object({
  code: z.string({ error: 'Code is required' }).min(1),
  state: z.string({ error: 'State is required' }).min(16, {
    error: 'State must be at least 16 characters',
  }),
});

export const orgAuthExchangeResponseSchema = z.object({
  session: z.object({
    token: z.string().min(1),
  }),
});

export type OrgUserRegisterSchemaType = z.infer<typeof orgUserRegisterSchema>;
export type OrgUserLoginSchemaType = z.infer<typeof orgUserLoginSchema>;
export type OrgUserVerifyEmailSchemaType = z.infer<typeof orgUserVerifyEmailSchema>;
export type OrgUserAuthCallbackUrlQuerySchemaType = z.infer<
  typeof orgUserAuthCallbackUrlQuerySchema
>;
export type OrgAuthPendingVerificationResponseSchemaType = z.infer<
  typeof orgAuthPendingVerificationResponseSchema
>;
export type OrgAuthRedirectReadyResponseSchemaType = z.infer<
  typeof orgAuthRedirectReadyResponseSchema
>;
export type OrgAuthFlowResponseSchemaType = z.infer<typeof orgAuthFlowResponseSchema>;
export type OrgAuthExchangeSchemaType = z.infer<typeof orgAuthExchangeSchema>;
export type OrgSdkCallbackQuerySchemaType = z.infer<typeof orgSdkCallbackQuerySchema>;
export type OrgAuthExchangeResponseSchemaType = z.infer<typeof orgAuthExchangeResponseSchema>;
