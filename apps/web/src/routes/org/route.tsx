import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/org')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="flex h-screen w-full items-center justify-center bg-background">
      <Outlet />
    </section>
  );
}
