import { z } from 'zod';
import { isoDateStringSchema } from '#/zod';

export const orgResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  rootAdminId: z.uuid(),
  logoUrl: z.string().nullable(),
  apiKeyHash: z.string(),
  appHomeUrl: z.array(z.string()),
  appCallbackUrl: z.array(z.string()),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});
