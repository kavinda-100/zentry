import { z } from 'zod';
import {
  accountSchema,
  membershipSchema,
  organizationSchema,
  userSchema,
} from '@zentry/validation';

export const authSessionDataSchema = z.object({
  session: z.object({
    token: z.string().min(1),
  }),
});

export const isAuthenticatedSchema = z.object({
  isAuthenticated: z.boolean(),
});

export const meUserDataSchema = userSchema.extend({
  accounts: z.array(accountSchema),
  organizations: z.array(organizationSchema),
  memberships: z.array(membershipSchema),
});

export const emptyResponseDataSchema = z.null();
