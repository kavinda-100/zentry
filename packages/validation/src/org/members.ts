import { z } from 'zod';
import { jsonValueSchema, roleSchema } from '../index';

export const getMemberParamsSchema = z.object({
  memberId: z.string(),
  organizationId: z.string(),
});

export const updateMemberRoleParamsSchema = z.object({
  memberId: z.string(),
  organizationId: z.string(),
});

export const updateMemberRoleSchema = z.object({ role: roleSchema });

export const revokeMemberSessionParamsSchema = z.object({
  memberId: z.string(),
  organizationId: z.string(),
});

export const banMemberParamsSchema = getMemberParamsSchema;
export const unbanMemberParamsSchema = getMemberParamsSchema;

export const updateMemberPermissionsParamsSchema = getMemberParamsSchema;
export const updateMemberPermissionsSchema = z.object({
  permissions: jsonValueSchema.nullable(),
});

export const deleteMemberParamsSchema = getMemberParamsSchema;

export type GetMemberSchemaType = z.infer<typeof getMemberParamsSchema>;
export type UpdateMemberRoleParamsSchemaType = z.infer<typeof updateMemberRoleParamsSchema>;
export type UpdateMemberRoleSchemaType = z.infer<typeof updateMemberRoleSchema>;
export type RevokeMemberSessionSchemaType = z.infer<typeof revokeMemberSessionParamsSchema>;
export type BanMemberParamsSchemaType = z.infer<typeof banMemberParamsSchema>;
export type UnbanMemberParamsSchemaType = z.infer<typeof unbanMemberParamsSchema>;
export type UpdateMemberPermissionsParamsSchemaType = z.infer<
  typeof updateMemberPermissionsParamsSchema
>;
export type UpdateMemberPermissionsSchemaType = z.infer<typeof updateMemberPermissionsSchema>;
export type DeleteMemberParamsSchemaType = z.infer<typeof deleteMemberParamsSchema>;
