import { z } from 'zod';

export const orgUserAuthFlowResponseSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('PENDING_EMAIL_VERIFICATION'),
    verificationFlowId: z.uuid(),
    email: z.email(),
    callbackUrl: z.url(),
    state: z.string().min(16),
    expiresAt: z.string().datetime(),
  }),
  z.object({
    status: z.literal('READY_FOR_REDIRECT'),
    code: z.string().min(1),
    callbackUrl: z.url(),
    state: z.string().min(16),
    expiresAt: z.string().datetime(),
  }),
]);

export const orgAuthExchangeResponseSchema = z.object({
  session: z.object({
    token: z.string().min(1),
  }),
});

export const orgSdkCallbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(16),
});
