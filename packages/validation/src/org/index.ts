import { z } from 'zod';

export const createOrgSchema = z.object({
  name: z.string().min(1, { message: 'Organization name is required.' }),
  logoUrl: z.url().optional(),
  appHomeUrls: z.array(z.url()).optional(),
  appCallbackUrls: z.array(z.url()).optional(),
});

export const updateOrgSchema = createOrgSchema.partial();

export const orgIdParamSchema = z.object({
  id: z.uuid({ message: 'Invalid organization ID format.' }),
});

export type CreateOrgSchemaType = z.infer<typeof createOrgSchema>;
export type UpdateOrgSchemaType = z.infer<typeof updateOrgSchema>;
export type OrgIdParamSchemaType = z.infer<typeof orgIdParamSchema>;
