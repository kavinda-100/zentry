import { QueryClient } from '@tanstack/react-query';

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retryDelay: 1000, // 1 second
      },
    },
  });

  return {
    queryClient,
  };
}
export default function TanstackQueryProvider() {}
