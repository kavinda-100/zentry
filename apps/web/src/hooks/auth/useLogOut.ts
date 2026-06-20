import { useMutation } from '@tanstack/react-query';
import api from '#/lib/axios.ts';

export function useLogOut() {
  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/logout');
      return response.data;
    },
  });

  return { isPending, mutate };
}
