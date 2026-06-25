import { useMutation } from '@tanstack/react-query';
import api from '#/lib/axios.ts';
import { createOkResponseSchema } from '#/zod';
import { emptyResponseDataSchema } from '#/zod/auth';

export function useRevokeMemberSession(projectId: string, memberId: string) {
  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/org/members/revoke-session/${memberId}/${projectId}`);
      const validator = createOkResponseSchema(emptyResponseDataSchema);
      const validatedData = validator.safeParse(response.data);

      if (!validatedData.success) {
        console.error('Invalid revoke member session response:', validatedData.error.issues);
        throw new Error('Invalid response from server');
      }

      return validatedData.data;
    },
  });

  return { mutate, mutateAsync, isPending };
}
