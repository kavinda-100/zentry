import * as React from 'react';
import DashboardSideBar from '#/components/dashboard/DashboardSideBar.tsx';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className={'w-full min-h-screen flex'}>
      {/*  sidebar*/}
      <DashboardSideBar />

      {/*  content*/}
      <div className="flex-1">{children}</div>
    </section>
  );
};
export default DashboardLayout;
