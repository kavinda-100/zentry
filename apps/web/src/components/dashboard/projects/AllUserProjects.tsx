import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, FolderKanban, RefreshCw, TriangleAlert } from 'lucide-react';
import type { z } from 'zod';
import { SectionWrapper } from '#/components/dashboard/SectionWrapper.tsx';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '#/components/ui/alert.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar.tsx';
import { Button } from '#/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx';
import { Skeleton } from '#/components/ui/skeleton.tsx';
import { useGetUserOrgs } from '#/hooks/org/usegetUserOrgs.ts';
import { orgGetAllResponseSchema } from '#/zod/org';

type UserOrg = z.infer<typeof orgGetAllResponseSchema>[number];

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(date);
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
};

const ProjectCardSkeleton = () => {
  return (
    <Card className="overflow-hidden border border-(--line) bg-(--surface) shadow-none ring-0">
      <CardHeader className="gap-4 border-b border-(--line) pb-5">
        <div className="flex items-start gap-4">
          <Skeleton className="size-14 rounded-full" />
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="size-5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 py-5">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  );
};

const ProjectCard = ({ project }: { project: UserOrg }) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() =>
        navigate({
          to: '/dashboard/projects/$projectId',
          params: { projectId: project.id },
        })
      }
      className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Card className="h-full overflow-hidden border border-(--line) bg-(--surface) shadow-none ring-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-border group-hover:bg-white/90 group-hover:shadow-lg dark:group-hover:bg-slate-950/60">
        <CardHeader className="gap-4 border-b border-(--line) bg-linear-to-r from-white/80 via-transparent to-transparent pb-5 dark:from-slate-900/30">
          <div className="flex items-start gap-4">
            <Avatar size="lg" className="size-14 border border-(--line) bg-(--surface-strong)">
              <AvatarImage src={project.logoUrl ?? undefined} alt={project.name} />
              <AvatarFallback className="bg-primary/10 font-semibold uppercase text-primary">
                {getInitials(project.name) || 'P'}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-lg tracking-[0.08em] text-(--sea-ink) dark:text-slate-100">
                {project.name}
              </CardTitle>
              <CardDescription className="mt-2 text-(--sea-ink-soft)">
                Open project workspace
              </CardDescription>
            </div>

            <ArrowUpRight className="mt-1 size-4 text-(--sea-ink-soft)" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 py-5">
          <div className="space-y-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)">
              Name
            </p>
            <p className="truncate text-sm text-(--sea-ink) dark:text-slate-100">{project.name}</p>
          </div>

          <div className="space-y-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)">
              Created At
            </p>
            <p className="truncate text-sm text-(--sea-ink-soft)">
              {formatDate(project.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>
    </button>
  );
};

const AllUserProjects = () => {
  const { data, isPending, isError, error } = useGetUserOrgs();
  const queryClient = useQueryClient();

  if (isPending) {
    return (
      <SectionWrapper header="Workspace Apps" title="All Projects">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </div>
      </SectionWrapper>
    );
  }

  if (isError || !data) {
    return (
      <SectionWrapper header="Workspace Apps" title="All Projects">
        <Alert
          variant="destructive"
          className="border-destructive/20 bg-destructive/10 shadow-none"
        >
          <TriangleAlert className="mt-0.5 size-4" />
          <AlertTitle className="tracking-[0.14em] uppercase">Unable to load projects</AlertTitle>
          <AlertDescription className="leading-6 text-destructive/80">
            {error?.message ?? 'Something went wrong while loading your projects.'}
          </AlertDescription>
          <AlertAction>
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['user-orgs'] })}
            >
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          </AlertAction>
        </Alert>
      </SectionWrapper>
    );
  }

  const projects = data.data;

  return (
    <SectionWrapper header="Workspace Apps" title="All Projects">
      {projects.length === 0 ? (
        <Card className="overflow-hidden border border-dashed border-(--line) bg-(--surface) shadow-none ring-0">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full border border-(--line) bg-(--surface-strong)">
              <FolderKanban className="size-6 text-(--sea-ink-soft)" />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading text-lg font-semibold tracking-[0.08em] text-(--sea-ink) dark:text-slate-100">
                No projects yet
              </h3>
              <p className="max-w-md text-sm leading-6 text-(--sea-ink-soft)">
                Create your first organization to start managing apps, branding, and callback URLs.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </SectionWrapper>
  );
};

export default AllUserProjects;
