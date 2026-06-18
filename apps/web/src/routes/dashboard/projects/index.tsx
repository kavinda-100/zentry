import { createFileRoute } from '@tanstack/react-router';
import { SectionWrapper } from '#/components/dashboard/SectionWrapper.tsx';
import CreateAnOrganization from '#/components/dashboard/projects/CreateAnOrganization.tsx';

export const Route = createFileRoute('/dashboard/projects/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="flex w-full flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
      {/*  create organization button*/}
      <SectionWrapper header="Apps" title={'Projects'} className={'w-fit'}>
        <CreateAnOrganization />
      </SectionWrapper>

      {/*  All Projects/apps user created*/}
    </section>
  );
}
