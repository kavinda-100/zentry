import { createFileRoute } from '@tanstack/react-router';
import { SectionWrapper } from '#/components/dashboard/SectionWrapper.tsx';
import {
  ProjectOverview,
  ProjectOverviewError,
} from '#/components/dashboard/projects/ProjectOverview.tsx';
import { useGetOrgById } from '#/hooks/org/useGetOrgById.ts';

export const Route = createFileRoute('/dashboard/projects/$projectId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  const { data, isPending, isError, error } = useGetOrgById(projectId);

  return (
    <section className="flex w-full flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
      <SectionWrapper header="Project Docs" title="Organization Details">
        {isError ? (
          <ProjectOverviewError
            message={error?.message ?? 'Something went wrong while loading organization details.'}
          />
        ) : (
          <ProjectOverview data={data?.data} isPending={isPending} />
        )}
      </SectionWrapper>
    </section>
  );
}
