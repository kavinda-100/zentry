import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getIsAuthenticated } from '#/hooks/auth/authentication.ts';

export const Route = createFileRoute('/(auth)')({
  beforeLoad: async ({ context }) => {
    if (typeof window === 'undefined') {
      return;
    }

    const isAuthenticated = await getIsAuthenticated(context.queryClient);
    if (isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: RouteComponent,
});

// Auth Layout
function RouteComponent() {
  return (
    <section className="flex h-screen w-full items-center justify-center">
      <Outlet />
    </section>
  );
}
