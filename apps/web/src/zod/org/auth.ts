import { z } from 'zod';

export const orgUserAuthFlowResponseSchema = z.object({
  session: z.object({
    token: z.string().min(1),
  }),
  verificationRequired: z.boolean(),
  shouldRedirect: z.boolean(),
  callbackUrl: z.url(),
});
