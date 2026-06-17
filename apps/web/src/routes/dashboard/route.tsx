import { createFileRoute, Outlet } from '@tanstack/react-router';
import DashboardSideBar from '#/components/dashboard/DashboardSideBar.tsx';

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
});

// Dashboard Layout
function RouteComponent() {
  return (
    <section className={'w-full min-h-screen flex'}>
      {/*  sidebar*/}
      <DashboardSideBar />

      {/*  content*/}
      <div className="flex-1">
        <Outlet />
      </div>
    </section>
  );
}
