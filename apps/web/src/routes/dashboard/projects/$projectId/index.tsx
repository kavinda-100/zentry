import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/projects/$projectId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  return <div>Hello "/dashboard/projects/$projectId/"! = {projectId}</div>;
}
