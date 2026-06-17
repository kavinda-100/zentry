import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import LogOutButton from '#/components/auth/LogOutButton.tsx';
import PersonalInfoSection from '#/components/dashboard/settings/PersonalInfoSection.tsx';
import { cn } from '#/lib/utils.ts';

export const Route = createFileRoute('/dashboard/settings/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="flex w-full flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
      {/*  personal info and account settings/update button*/}
      <SectionWrapper title={'Personal Info'}>
        <PersonalInfoSection />
      </SectionWrapper>

      {/*  Logout button*/}
      <SectionWrapper title={'Logout'} className={'w-fit'}>
        <LogOutButton />
      </SectionWrapper>
    </section>
  );
}

type SectionProps = {
  className?: string;
  title: string;
  children: React.ReactNode;
};
function SectionWrapper({ title, children, className }: SectionProps) {
  return (
    <section className={cn('flex w-full flex-col gap-4', className)}>
      <div className="space-y-2">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)">
          Settings
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-[0.08em] text-slate-950 dark:text-slate-100">
          {title}
        </h1>
      </div>
      {children}
    </section>
  );
}
