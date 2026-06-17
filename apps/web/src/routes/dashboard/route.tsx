import { createFileRoute, Outlet } from '@tanstack/react-router';
import DashboardSideBar from '#/components/dashboard/DashboardSideBar.tsx';

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
});

// Dashboard Layout
function RouteComponent() {
  return (
    <section className="flex min-h-screen w-full flex-col md:flex-row">
      {/*  sidebar*/}
      <DashboardSideBar />

      {/*  content*/}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </section>
  );
}
