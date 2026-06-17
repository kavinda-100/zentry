import { useMutation } from '@tanstack/react-query';
import type { VerifyEmailSchemaType } from '@zentry/validation';
import api from '#/lib/axios.ts';
import { createOkResponseSchema } from '#/zod';
import { emptyResponseDataSchema } from '#/zod/auth';

export function useVerifyEmail() {
  const { isPending, mutate } = useMutation({
    mutationFn: async (data: VerifyEmailSchemaType) => {
      const response = await api.post('/auth/verify-email', data);
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

  return { isPending, mutate };
}
