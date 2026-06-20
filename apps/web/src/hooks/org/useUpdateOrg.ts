import { useMutation } from '@tanstack/react-query';
import type { UpdateOrgSchemaType } from '@zentry/validation';
import api from '#/lib/axios.ts';
import { createOkResponseSchema } from '#/zod';
import { orgUpdateResponseSchema } from '#/zod/org';

export function useUpdateOrg(projectId: string) {
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: UpdateOrgSchemaType) => {
      const response = await api.patch(`/org/${projectId}`, data);
      console.log(response.data);

      // validate the response
      const validator = createOkResponseSchema(orgUpdateResponseSchema);
      const validatedData = validator.safeParse(response.data);
      if (!validatedData.success) {
        console.error('Invalid response from server:', validatedData.error.issues);
        throw new Error('Invalid response from server');
      }
      return validatedData.data;
    },
  });

  return { mutate, isPending };
}
