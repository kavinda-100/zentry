import { useQuery } from '@tanstack/react-query';
import api from '#/lib/axios.ts';
import { createOkResponseSchema } from '#/zod';
import { memberDetailsResponseSchema } from '#/zod/org';
import { orgMemberQueryKey } from '#/hooks/org/members/queryKeys.ts';

export function useGetMemberDetails(projectId: string, memberId: string) {
  const { data, isPending, isError, error } = useQuery({
    queryKey: orgMemberQueryKey(projectId, memberId),
    queryFn: async () => {
      const response = await api.get(`/org/members/${memberId}/${projectId}`);
      const validator = createOkResponseSchema(memberDetailsResponseSchema);
      const validatedData = validator.safeParse(response.data);

      if (!validatedData.success) {
        console.error('Invalid member details response:', validatedData.error.issues);
        throw new Error('Invalid response from server');
      }

      return validatedData.data;
    },
  });

  return { data, isPending, isError, error };
}
