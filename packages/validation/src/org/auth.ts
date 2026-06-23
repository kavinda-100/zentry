import { z } from 'zod';

export const orgUserAuthCallbackUrlParamSchema = z.object({
  callbackUrl: z.string({ error: 'Callback URL is required' }),
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

export type OrgUserRegisterSchemaType = z.infer<typeof orgUserRegisterSchema>;
export type OrgUserLoginSchemaType = z.infer<typeof orgUserLoginSchema>;
export type OrgUserVerifyEmailSchemaType = z.infer<typeof orgUserVerifyEmailSchema>;
export type OrgUserAuthCallbackUrlParamSchemaType = z.infer<
  typeof orgUserAuthCallbackUrlParamSchema
>;
