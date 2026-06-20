import { z } from 'zod';
import { roleSchema } from '../index';

export const getMemberParamsSchema = z.object({
  memberId: z.string(),
  organizationId: z.string(),
});

export const updateMemberRoleParamsSchema = getMemberParamsSchema;
export const updateMemberRoleSchema = z.object({ role: roleSchema });

export type GetMemberSchemaType = z.infer<typeof getMemberParamsSchema>;
export type UpdateMemberRoleParamsSchemaType = z.infer<typeof updateMemberRoleParamsSchema>;
export type UpdateMemberRoleSchemaType = z.infer<typeof updateMemberRoleSchema>;
