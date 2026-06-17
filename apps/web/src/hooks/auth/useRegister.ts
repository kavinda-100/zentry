import { useMutation } from '@tanstack/react-query';
import type { RegisterSchemaType } from '@zentry/validation';
import api from '#/lib/axios.ts';
import { createOkResponseSchema } from '#/zod';
import { authSessionDataSchema } from '#/zod/auth';

export function useRegister() {
  const { isPending, mutate } = useMutation({
    mutationFn: async (data: RegisterSchemaType) => {
      const response = await api.post('/auth/register', data);
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
}
