import { createFileRoute } from '@tanstack/react-router';
import DashboardLayout from '#/layouts/DashboardLayout.tsx';

export const Route = createFileRoute('/(dashboard)/dashboard/overview')({
  component: DashboardOverviewComponent,
});

function DashboardOverviewComponent() {
  return <DashboardLayout>Overview content</DashboardLayout>;
}
