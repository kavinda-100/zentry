import { Cog, Component, FolderKanban, Menu } from 'lucide-react';
import { cn } from '#/lib/utils.ts';
import { Link, useRouterState } from '@tanstack/react-router';
import { Button } from '@/components/ui/button.tsx';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '#/hooks/use-mobile.ts';
import { useState } from 'react';

const routes = [
  {
    name: 'Overview',
    path: '/dashboard',
    icon: <Component />,
  },
  {
    name: 'Apps',
    path: '/dashboard/projects',
    icon: <FolderKanban />,
  },
  {
    name: 'Settings',
    path: '/dashboard/settings',
    icon: <Cog />,
  },
];

type DashboardSideBarProps = {
  className?: string;
};

const DashboardSideBar = ({ className }: DashboardSideBarProps) => {
  const isMobile = useIsMobile();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);

  const isRouteActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }

    return pathname.startsWith(path);
  };

  const navItems = (
    <nav className="flex flex-col gap-2">
      {routes.map(({ name, path, icon }) => {
        const isActive = isRouteActive(path);

        return (
          <Button
            key={path}
            asChild
            variant={isActive ? 'default' : 'ghost'}
            className={'h-14 w-full justify-start px-4 text-[0.78rem] tracking-[0.16em]'}
          >
            <Link to={path} onClick={() => setOpen(false)}>
              <span className={'text-black/70'}>{icon}</span>
              <span className={'text-black/70'}>{name}</span>
            </Link>
          </Button>
        );
      })}
    </nav>
  );

  if (isMobile) {
    return (
      <>
        <div
          className={cn(
            'sticky top-0 z-20 border-b border-(--line) bg-(--header-bg) backdrop-blur-xl',
            className,
          )}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="min-w-0">
              <p className="text-md font-semibold uppercase tracking-[0.22em] text-(--kicker)">
                Hi User
              </p>
              <p className="mt-2 text-xs leading-6 text-(--sea-ink-soft)">
                Manage projects, review activity, and update workspace settings.
              </p>
            </div>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="border-(--line) bg-(--surface-strong) text-(--sea-ink)"
                  aria-label="Open dashboard navigation"
                >
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[18rem] border-r border-(--line) bg-(--surface-strong) px-0"
              >
                <SheetHeader className="border-b border-(--line) px-5 py-5 text-left">
                  <SheetTitle className="text-(--sea-ink)">Dashboard</SheetTitle>
                  <SheetDescription className="text-(--sea-ink-soft)">
                    Move between overview, apps, and settings.
                  </SheetDescription>
                </SheetHeader>
                <div className="px-4 py-5">{navItems}</div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </>
    );
  }

  return (
    <aside
      className={cn(
        'hidden h-screen w-72 shrink-0 border-r border-(--line) bg-(--surface) md:flex md:flex-col',
        className,
      )}
    >
      <div className="border-b border-(--line) px-6 py-6">
        <p className="text-md font-semibold uppercase tracking-[0.22em] text-(--kicker)">Hi User</p>
        <p className="mt-2 text-xs leading-6 text-(--sea-ink-soft)">
          Manage projects, review activity, and update workspace settings.
        </p>
      </div>
      <div className="flex-1 px-4 py-5">{navItems}</div>
    </aside>
  );
};
export default DashboardSideBar;
