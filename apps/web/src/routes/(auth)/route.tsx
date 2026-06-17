import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/(auth)')({
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
