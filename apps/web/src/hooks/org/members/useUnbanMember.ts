import { useMutation } from '@tanstack/react-query';
import api from '#/lib/axios.ts';
import { createOkResponseSchema } from '#/zod';
import { memberMutationResponseSchema } from '#/zod/org';

export function useUnbanMember(projectId: string, memberId: string) {
  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/org/members/unban/${memberId}/${projectId}`);
      const validator = createOkResponseSchema(memberMutationResponseSchema);
      const validatedData = validator.safeParse(response.data);

      if (!validatedData.success) {
        console.error('Invalid unban member response:', validatedData.error.issues);
        throw new Error('Invalid response from server');
      }

      return validatedData.data;
    },
  });

  return { mutate, mutateAsync, isPending };
}
