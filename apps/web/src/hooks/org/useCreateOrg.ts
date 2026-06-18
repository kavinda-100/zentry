import { useMutation } from '@tanstack/react-query';
import api from '#/lib/axios.ts';
import { type CreateOrgSchemaType } from '@zentry/validation';
import { createOkResponseSchema } from '#/zod';
import { orgResponseSchema } from '#/zod/org';

export function useCreateOrg() {
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: CreateOrgSchemaType) => {
      const response = await api.post('/org', data);
      console.log(response.data);

      // validate the response
      const validator = createOkResponseSchema(orgResponseSchema);
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
