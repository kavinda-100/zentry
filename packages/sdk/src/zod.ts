import { z } from 'zod';
import {
  userSchema,
  organizationSchema,
  membershipSchema,
  accountSchema,
} from '@zentry/validation';

const responseBaseSchema = {
  status_code: z.number().int().nonnegative(),
  message: z.string(),
};

export const createOkResponseSchema = <TData extends z.ZodType>(dataSchema: TData) =>
  z.object({
    success: z.literal(true),
    ...responseBaseSchema,
    data: dataSchema,
  });

export const ZentrySessionSchema = z.object({
  user: userSchema,
  org: z.object({
    id: organizationSchema.shape.id,
    name: organizationSchema.shape.name,
  }),
  membership: z.object({
    id: membershipSchema.shape.id,
    role: membershipSchema.shape.role,
    isBanned: membershipSchema.shape.isBanned,
    permissions: membershipSchema.shape.permissions,
  }),
  account: z.object({
    id: accountSchema.shape.id,
    provider: accountSchema.shape.provider,
    providerType: accountSchema.shape.providerType,
    accountId: accountSchema.shape.accountId,
    providerAvatarUrl: accountSchema.shape.providerAvatarUrl,
  }),
});

export type ZentrySessionType = z.infer<typeof ZentrySessionSchema>;
