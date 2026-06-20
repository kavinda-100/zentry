import { useMutation } from '@tanstack/react-query';
import api from '#/lib/axios.ts';
import { createOkResponseSchema } from '#/zod';
import { emptyResponseDataSchema } from '#/zod/auth';

export function useDeleteOrg(projectId: string) {
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/org/${projectId}`);
      console.log(response.data);

      // validate the response
      const validator = createOkResponseSchema(emptyResponseDataSchema);
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