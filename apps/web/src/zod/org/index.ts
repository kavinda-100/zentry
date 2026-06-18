import { z } from 'zod';
import { isoDateStringSchema } from '#/zod';

export const orgCreateResponseSchema = z.object({
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

export const orgGetAllResponseSchema = z.array(
  orgCreateResponseSchema.extend({
    apiKeyRow: z.string(),
    apiKeyPrefix: z.string(),
  }),
);
