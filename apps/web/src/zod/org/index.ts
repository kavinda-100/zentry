import { z } from 'zod';
import { membershipSchema, organizationSchema, userSchema } from '#/zod';

export const orgCreateResponseSchema = organizationSchema.omit({
  apiKeyRow: true,
  apiKeyPrefix: true,
});

export const orgUpdateResponseSchema = organizationSchema;

export const orgGetAllResponseSchema = z.array(organizationSchema);

export const orgMembershipSchema = membershipSchema.extend({
  user: userSchema,
});

export const orgGetByIdResponseSchema = organizationSchema.extend({
  memberships: z.array(orgMembershipSchema),
});
