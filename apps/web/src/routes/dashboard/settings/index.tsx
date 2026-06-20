import { createFileRoute } from '@tanstack/react-router';
import LogOutButton from '#/components/auth/LogOutButton.tsx';
import PersonalInfoSection from '#/components/dashboard/settings/PersonalInfoSection.tsx';
import { SectionWrapper } from '#/components/dashboard/SectionWrapper.tsx';

export const Route = createFileRoute('/dashboard/settings/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="flex w-full flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
      {/*  personal info and account settings/update button*/}
      <SectionWrapper header="Personal" title={'Personal Info'}>
        <PersonalInfoSection />
      </SectionWrapper>

      {/*  Logout button*/}
      <SectionWrapper header="Account" title={'Logout'} className={'w-fit'}>
        <LogOutButton />
      </SectionWrapper>
    </section>
  );
}
