import { createFileRoute, Outlet } from '@tanstack/react-router';
import DashboardSideBar from '#/components/dashboard/DashboardSideBar.tsx';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar.tsx';
import * as React from 'react';
import { ModeToggle } from '#/components/ModeToggle.tsx';

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
});

// Dashboard Layout
function RouteComponent() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '18rem',
          '--sidebar-width-icon': '4.5rem',
        } as React.CSSProperties
      }
    >
      <DashboardSideBar />
      <SidebarInset className="min-w-0 bg-transparent">
        <section className="flex min-h-screen w-full flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-(--line) bg-(--header-bg) px-4 py-3 backdrop-blur-xl md:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="border border-(--line) bg-(--surface-strong) text-(--sea-ink) hover:bg-white hover:text-(--sea-ink)" />
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)">
                  Dashboard
                </p>
                <p className="text-sm text-(--sea-ink-soft)">
                  Manage your workspace from one place.
                </p>
              </div>
            </div>

            {/*  Theme Toggle*/}
            <ModeToggle />
          </header>

          <div className="flex-1 min-w-0 bg-background">
            <Outlet />
          </div>
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
}
