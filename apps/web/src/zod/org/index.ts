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

export const orgMembershipTableRowSchema = z.object({
  email: userSchema.shape.email,
  role: membershipSchema.shape.role,
  isBanned: membershipSchema.shape.isBanned,
  userId: membershipSchema.shape.userId,
  createdAt: membershipSchema.shape.createdAt,
  userImageUrl: userSchema.shape.imageUrl,
});

export const orgMembershipTableRowsSchema = z.array(orgMembershipTableRowSchema);

export const orgGetByIdResponseSchema = organizationSchema.extend({
  memberships: z.array(orgMembershipSchema),
});
