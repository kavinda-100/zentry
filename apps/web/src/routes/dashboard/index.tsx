import { createFileRoute } from '@tanstack/react-router';
import { DashboardOverview } from '#/components/dashboard/DashboardOverview.tsx';

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <DashboardOverview />;
}
