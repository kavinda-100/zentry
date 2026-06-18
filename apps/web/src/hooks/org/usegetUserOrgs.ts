import { useQuery } from '@tanstack/react-query';
import api from '#/lib/axios.ts';
import { createOkResponseSchema } from '#/zod';
import { orgGetAllResponseSchema } from '#/zod/org';

export const useGetUserOrgs = () => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['user-orgs'],
    queryFn: async () => {
      const response = await api.get('/org/my/all');
      console.log(response.data);

      // validate the response
      const validator = createOkResponseSchema(orgGetAllResponseSchema);
      const validatedData = validator.safeParse(response.data);
      if (!validatedData.success) {
        console.error('Invalid response from server:', validatedData.error.issues);
        throw new Error('Invalid response from server');
      }
      return validatedData.data;
    },
  });

  return { data, isPending, isError, error };
};
