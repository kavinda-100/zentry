import { Cog, Component, FolderKanban } from 'lucide-react';
import { cn } from '#/lib/utils.ts';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button.tsx';

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
  return (
    <aside className={cn('w-64 border-r', className)}>
      {routes.map((route) => (
        <Button key={route.path} asChild variant="ghost" className="justify-start w-full">
          <Link to={route.path}>
            {route.icon}
            <span className="ml-2">{route.name}</span>
          </Link>
        </Button>
      ))}
    </aside>
  );
};
export default DashboardSideBar;
