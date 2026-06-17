import { useQuery } from '@tanstack/react-query';
import api from '#/lib/axios.ts';
import { createOkResponseSchema } from '#/zod';
import { meUserDataSchema } from '#/zod/auth';

export const useGetMe = () => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      console.log(response.data);

      // validate the response
      const validator = createOkResponseSchema(meUserDataSchema);
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
