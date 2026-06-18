import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/projects/$projectId/member/$memberId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId, memberId } = Route.useParams();
  return (
    <div>
      Hello "/dashboard/projects/$projectId/member/$memberId/"! = {memberId} = {projectId}
    </div>
  );
}
