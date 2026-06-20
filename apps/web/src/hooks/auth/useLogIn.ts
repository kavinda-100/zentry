import { useMutation } from '@tanstack/react-query';
import api from '#/lib/axios.ts';
import type { LoginSchemaType } from '@zentry/validation';
import { createOkResponseSchema } from '#/zod';
import { authSessionDataSchema } from '#/zod/auth';

export const useLogIn = () => {
  const { isPending, mutate } = useMutation({
    mutationFn: async (data: LoginSchemaType) => {
      const response = await api.post('/auth/login', data);
      console.log(response.data);
      // validate the response
      const validator = createOkResponseSchema(authSessionDataSchema);
      const validatedData = validator.safeParse(response.data);
      if (!validatedData.success) {
        console.error('Invalid response from server:', validatedData.error.issues);
        throw new Error('Invalid response from server');
      }

      return validatedData.data;
    },
  });

  return { isPending, mutate };
};
