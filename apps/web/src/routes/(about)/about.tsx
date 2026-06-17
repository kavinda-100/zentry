import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/(about)/about')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      from about layout
      <Outlet />
    </div>
  );
}
