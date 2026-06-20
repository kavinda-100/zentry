import { useQuery } from '@tanstack/react-query';
import api from '#/lib/axios.ts';
import { createOkResponseSchema } from '#/zod';
import { orgGetByIdResponseSchema } from '#/zod/org';

export function useGetOrgById(projectId: string) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['org', projectId],
    queryFn: async () => {
      const response = await api.get(`/org/${projectId}`);
      console.log(response.data);

      // validate the response
      const validator = createOkResponseSchema(orgGetByIdResponseSchema);
      const validatedData = validator.safeParse(response.data);
      if (!validatedData.success) {
        console.error('Invalid response from server:', validatedData.error.issues);
        throw new Error('Invalid response from server');
      }
      return validatedData.data;
    },
  });

  return { data, isPending, isError, error };
}
