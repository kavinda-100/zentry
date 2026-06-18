import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { SectionWrapper } from '#/components/dashboard/SectionWrapper.tsx';
import {
  ProjectOverview,
  ProjectOverviewError,
} from '#/components/dashboard/projects/ProjectOverview.tsx';
import { useGetOrgById } from '#/hooks/org/useGetOrgById.ts';
import { Button } from '#/components/ui/button.tsx';
import GoBack from '#/components/dashboard/GoBack.tsx';
import DeleteOrg from '#/components/dashboard/projects/DeleteOrg.tsx';

export const Route = createFileRoute('/dashboard/projects/$projectId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  const { data, isPending, isError, error } = useGetOrgById(projectId);
  const navigate = useNavigate();

  const handleClick = async () => {
    await navigate({
      to: '/dashboard/projects/$projectId/edit',
      params: {
        projectId: projectId,
      },
    });
  };

  return (
    <section className="flex w-full flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
      <GoBack />
      <SectionWrapper header="Project Docs" title="Organization Details">
        {isError ? (
          <ProjectOverviewError
            message={error?.message ?? 'Something went wrong while loading organization details.'}
          />
        ) : (
          <>
            <ProjectOverview data={data?.data} isPending={isPending} />
            {/*    Members table */}
          </>
        )}
      </SectionWrapper>

      {/*    edit and delete buttons*/}
      <SectionWrapper header="Project Docs" title="Manage Organization Details" className={'w-fit'}>
        <div className={'flex items-center gap-4'}>
          <Button onClick={handleClick} className={'cursor-pointer'}>
            Edit
          </Button>
          <DeleteOrg orgId={projectId} />
        </div>
      </SectionWrapper>
    </section>
  );
}
