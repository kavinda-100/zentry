import { z } from 'zod';

export const isoDateStringSchema = z.string().min(1);
export const providerTypeSchema = z.enum(['CREDENTIAL', 'OAUTH']);
export const authProviderSchema = z.enum(['LOCAL', 'GOOGLE']);
export const roleSchema = z.enum(['ADMIN', 'MEMBER']);
export const jsonValueSchema = z.unknown();

export const userSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  firstName: z.string(),
  lastName: z.string(),
  emailVerified: z.boolean(),
  imageUrl: z.string().nullable(),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
});

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
    id: z.uuid(),
    name: z.string(),
  }),
  membership: z.object({
    id: z.uuid(),
    role: roleSchema,
    isBanned: z.boolean(),
    permissions: jsonValueSchema.nullable(),
  }),
  account: z.object({
    id: z.uuid(),
    provider: authProviderSchema,
    providerType: providerTypeSchema,
    accountId: z.string(),
    providerAvatarUrl: z.string().nullable(),
  }),
});

export type ZentrySessionType = z.infer<typeof ZentrySessionSchema>;
