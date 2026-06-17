import { Cog, Component, FolderKanban } from 'lucide-react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar.tsx';
import * as React from 'react';
import { buttonVariants } from '#/components/ui/button.tsx';

const routes = [
  {
    name: 'Overview',
    path: '/dashboard',
    icon: Component,
  },
  {
    name: 'Apps',
    path: '/dashboard/projects',
    icon: FolderKanban,
  },
  {
    name: 'Settings',
    path: '/dashboard/settings',
    icon: Cog,
  },
];

type DashboardSideBarProps = {
  className?: string;
};

const DashboardSideBar = ({ className }: DashboardSideBarProps) => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const isRouteActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }

    return pathname.startsWith(path);
  };

  return (
    <Sidebar
      collapsible="icon"
      className={className}
      style={
        {
          '--sidebar-width': '18rem',
          '--sidebar-width-icon': '4.5rem',
        } as React.CSSProperties
      }
    >
      <SidebarHeader className="gap-3 border-b border-(--line) bg-(--surface) px-4 py-5">
        <div className="flex items-center gap-3 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            U
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)">
              Workspace
            </p>
            <h1 className="mt-2 truncate font-heading text-xl font-semibold tracking-[0.08em] text-slate-950 dark:text-slate-100">
              User Name
            </h1>
            <p className="mt-2 text-xs leading-6 text-(--sea-ink-soft)">
              Manage projects, review activity, and update workspace settings.
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-(--surface) px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-(--sea-ink-soft)">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {routes.map(({ name, path, icon: Icon }) => {
                const isActive = isRouteActive(path);

                return (
                  <SidebarMenuItem key={path}>
                    <SidebarMenuButton asChild className="justify-start h-14">
                      <Link
                        to={path}
                        className={buttonVariants({ variant: isActive ? 'default' : 'ghost' })}
                      >
                        <Icon className={'size-4 text-black dark:text-white'} />
                        <span className={'text-black dark:text-white'}>{name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="bg-(--line)" />
    </Sidebar>
  );
};

export default DashboardSideBar;
