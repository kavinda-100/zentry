import { useMutation } from '@tanstack/react-query';
import type { UpdateMemberPermissionsSchemaType } from '@zentry/validation';
import api from '#/lib/axios.ts';
import { createOkResponseSchema } from '#/zod';
import { memberMutationResponseSchema } from '#/zod/org';

export function useUpdateMemberPermissions(projectId: string, memberId: string) {
  const { mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async (data: UpdateMemberPermissionsSchemaType) => {
      const response = await api.patch(
        `/org/members/update-permissions/${memberId}/${projectId}`,
        data,
      );
      const validator = createOkResponseSchema(memberMutationResponseSchema);
      const validatedData = validator.safeParse(response.data);

      if (!validatedData.success) {
        console.error('Invalid update member permissions response:', validatedData.error.issues);
        throw new Error('Invalid response from server');
      }

      return validatedData.data;
    },
  });

  return { mutate, mutateAsync, isPending };
}
