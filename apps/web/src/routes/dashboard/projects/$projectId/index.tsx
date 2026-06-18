import { createFileRoute } from '@tanstack/react-router';
import { useGetOrgById } from '#/hooks/org/useGetOrgById.ts';

export const Route = createFileRoute('/dashboard/projects/$projectId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  const {data, isPending, isError, error} = useGetOrgById(projectId);

  console.log(data);
  if(isPending) return <div>Loading...</div>;
  if(isError) return <div>Error: {error?.message}</div>;
  return <div>Hello "/dashboard/projects/$projectId/"! = {JSON.stringify(data, null, 2)}</div>;
}
