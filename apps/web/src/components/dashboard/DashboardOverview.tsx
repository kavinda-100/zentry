import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CircleCheck,
  CircleAlert,
  FolderKanban,
  Globe,
  Mail,
  RefreshCw,
  Settings,
  CodeXml,
} from 'lucide-react';
import { SectionWrapper } from '#/components/dashboard/SectionWrapper.tsx';
import CreateAnOrganization from '#/components/dashboard/projects/CreateAnOrganization.tsx';
import { Alert, AlertDescription, AlertTitle } from '#/components/ui/alert.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar.tsx';
import { Button } from '#/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx';
import { Skeleton } from '#/components/ui/skeleton.tsx';
import { useGetMe } from '#/hooks/auth/useGetMe.ts';
import { useGetUserOrgs } from '#/hooks/org/usegetUserOrgs.ts';

const boxClassName = 'min-w-0 border border-(--line) shadow-none ring-0';

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

function dateValue(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unavailable'
    : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
}

function LoadError({
  title,
  message,
  queryKey,
}: {
  title: string;
  message?: string;
  queryKey: string;
}) {
  const queryClient = useQueryClient();

  return (
    <Alert variant="destructive">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <p>{message ?? 'Something went wrong. Please try again.'}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void queryClient.invalidateQueries({ queryKey: [queryKey] })}
        >
          <RefreshCw data-icon="inline-start" aria-hidden="true" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function ProjectSkeleton() {
  return (
    <Card className={boxClassName} aria-label="Loading project">
      <CardHeader className="flex flex-row items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-36" />
      </CardFooter>
    </Card>
  );
}

export function DashboardOverview() {
  const account = useGetMe();
  const organizations = useGetUserOrgs();
  const user = account.data?.data;
  const name = user ? `${user.firstName} ${user.lastName}`.trim() : '';
  const projects = [...(organizations.data?.data ?? [])].sort(
    (left, right) => dateValue(right.createdAt) - dateValue(left.createdAt),
  );
  const newestProject = projects[0];

  return (
    <section className="flex w-full min-w-0 flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
      <SectionWrapper header="Workspace" title="Overview">
        {account.isPending ? (
          <Card className={boxClassName} aria-label="Loading account" aria-busy="true">
            <CardHeader className="flex flex-row items-center gap-4">
              <Skeleton className="size-14 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <Skeleton className="h-6 w-3/4 max-w-80" />
                <Skeleton className="h-4 w-1/2 max-w-64" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ) : account.isError || !user ? (
          <LoadError
            title="Unable to load your account"
            message={account.error?.message}
            queryKey="me"
          />
        ) : (
          <Card className={boxClassName}>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="size-14">
                <AvatarImage src={user.imageUrl ?? undefined} alt={name || 'Your profile'} />
                <AvatarFallback>{getInitials(name) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <CardTitle className="wrap-anywhere">
                  Welcome back{name ? `, ${name}` : ''}
                </CardTitle>
                <CardDescription>
                  Manage your projects and connect your apps to Zentry.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-6">
              <p className="flex min-w-0 items-center gap-2">
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                <span className="wrap-anywhere">{user.email}</span>
              </p>
              <p className="flex items-center gap-2">
                {user.emailVerified ? (
                  <CircleCheck className="size-4" aria-hidden="true" />
                ) : (
                  <CircleAlert className="size-4" aria-hidden="true" />
                )}
                {user.emailVerified ? 'Email verified' : 'Email not verified'}
              </p>
            </CardContent>
          </Card>
        )}
      </SectionWrapper>

      <SectionWrapper header="Get started" title="Quick actions">
        <Card className={boxClassName}>
          <CardHeader>
            <CardTitle>Your workspace tools</CardTitle>
            <CardDescription>
              Create an app workspace, continue setup, or manage your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <CreateAnOrganization label="Create project" />
            <Button variant="outline" asChild>
              <Link to="/dashboard/projects">
                <FolderKanban data-icon="inline-start" aria-hidden="true" />
                View all projects
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/docs">
                <BookOpen data-icon="inline-start" aria-hidden="true" />
                Read docs
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/settings">
                <Settings data-icon="inline-start" aria-hidden="true" />
                Account settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </SectionWrapper>

      <SectionWrapper header="Workspace apps" title="Project summary">
        {organizations.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
            <ProjectSkeleton />
            <ProjectSkeleton />
          </div>
        ) : organizations.isError || !organizations.data ? (
          <LoadError
            title="Unable to load your projects"
            message={organizations.error?.message}
            queryKey="user-orgs"
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className={boxClassName}>
                <CardHeader>
                  <FolderKanban className="size-5 text-muted-foreground" aria-hidden="true" />
                  <CardTitle>Total projects</CardTitle>
                  <CardDescription>Your app workspaces in Zentry.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tabular-nums">{projects.length}</p>
                </CardContent>
              </Card>
              <Card className={boxClassName}>
                <CardHeader>
                  <CalendarDays className="size-5 text-muted-foreground" aria-hidden="true" />
                  <CardTitle>Newest project</CardTitle>
                  <CardDescription>
                    {newestProject
                      ? `Created ${formatDate(newestProject.createdAt)}`
                      : 'Create your first app workspace to get started.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {newestProject ? (
                    <Link
                      to="/dashboard/projects/$projectId"
                      params={{ projectId: newestProject.id }}
                      className="flex min-w-0 items-center gap-2 font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <span className="truncate">{newestProject.name}</span>
                      <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
                    </Link>
                  ) : (
                    <p className="text-muted-foreground">No projects yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
            {projects.length === 0 && (
              <Card className={`${boxClassName} border-dashed`}>
                <CardHeader>
                  <CardTitle>Create your first project</CardTitle>
                  <CardDescription>
                    Use Create project in Quick actions above to start your first app workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="grid gap-5 text-sm sm:grid-cols-3">
                    <li className="flex items-start gap-3">
                      <FolderKanban
                        className="size-5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-semibold">1. Create a project</p>
                        <p className="mt-2 text-muted-foreground">
                          Choose a name for your organization.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Globe className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <div>
                        <p className="font-semibold">2. Configure URLs</p>
                        <p className="mt-2 text-muted-foreground">
                          Add your app home and authentication callback URLs.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CodeXml
                        className="size-5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-semibold">3. Connect the SDK</p>
                        <p className="mt-2 text-muted-foreground">
                          Open your project for installation and setup instructions.
                        </p>
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </SectionWrapper>

      {(organizations.isPending || (!organizations.isError && projects.length > 0)) && (
        <SectionWrapper header="Recently created" title="Recent projects">
          <div
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-busy={organizations.isPending}
          >
            {organizations.isPending
              ? Array.from({ length: 3 }, (_, index) => <ProjectSkeleton key={index} />)
              : projects.slice(0, 3).map((project) => (
                  <Card key={project.id} className={boxClassName}>
                    <CardHeader className="flex flex-row items-center gap-4">
                      <Avatar className="size-12">
                        <AvatarImage src={project.logoUrl ?? undefined} alt={project.name} />
                        <AvatarFallback>{getInitials(project.name) || 'P'}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <CardTitle className="truncate" title={project.name}>
                          {project.name}
                        </CardTitle>
                        <CardDescription>App workspace</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
                        Created {formatDate(project.createdAt)}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          to="/dashboard/projects/$projectId"
                          params={{ projectId: project.id }}
                          aria-label={`Open project ${project.name}`}
                        >
                          Open project
                          <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
          </div>
        </SectionWrapper>
      )}
    </section>
  );
}
