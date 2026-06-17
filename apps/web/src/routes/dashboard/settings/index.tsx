import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import LogOutButton from '#/components/auth/LogOutButton.tsx';
import { cn } from '#/lib/utils.ts';
import { useGetMe } from '#/hooks/auth/useGetMe.ts';

export const Route = createFileRoute('/dashboard/settings/')({
  component: RouteComponent,
});

function RouteComponent() {
  // getting personal info from server
  const { data, isPending, isError, error } = useGetMe();

  return (
    <section className={'flex flex-col w-full gap-3'}>
      {/*  personal info and account settings/update button*/}
      <SectionWrapper title={'Personal Info'}>
        {isPending && <p>Loading...</p>}
        {isError && <p>{error?.message}</p>}
        {data && <div className={'flex flex-col gap-3'}>{JSON.stringify(data.data)}</div>}
      </SectionWrapper>

      {/*  Logout button*/}
      <SectionWrapper title={'Logout'} className={'mt-10 w-fit'}>
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
    <section className={cn('flex flex-col w-full gap-3', className)}>
      <h1 className={'text-2xl font-bold'}>{title}</h1>
      {children}
    </section>
  );
}
