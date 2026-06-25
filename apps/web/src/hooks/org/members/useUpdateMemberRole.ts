import { useMutation } from '@tanstack/react-query';
import type { UpdateMemberRoleSchemaType } from '@zentry/validation';
import api from '#/lib/axios.ts';
import { createOkResponseSchema } from '#/zod';
import { memberMutationResponseSchema } from '#/zod/org';

export function useUpdateMemberRole(projectId: string, memberId: string) {
  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async (data: UpdateMemberRoleSchemaType) => {
      const response = await api.patch(`/org/members/update-role/${memberId}/${projectId}`, data);
      const validator = createOkResponseSchema(memberMutationResponseSchema);
      const validatedData = validator.safeParse(response.data);

      if (!validatedData.success) {
        console.error('Invalid update member role response:', validatedData.error.issues);
        throw new Error('Invalid response from server');
      }

      return validatedData.data;
    },
  });

  return { mutate, mutateAsync, isPending };
}
