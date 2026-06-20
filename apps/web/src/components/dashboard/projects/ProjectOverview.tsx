import { useState } from 'react';
import { Building2, Check, Copy, Globe, Package2, Shield, TriangleAlert } from 'lucide-react';
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
import { cn } from '#/lib/utils.ts';
import type { useGetOrgById } from '#/hooks/org/useGetOrgById.ts';

type OrgResponse = NonNullable<ReturnType<typeof useGetOrgById>['data']>['data'];
type PackageManager = 'npm' | 'pnpm' | 'bun';

const packageManagerCommands: Record<PackageManager, string> = {
  npm: 'npm install zentry',
  pnpm: 'pnpm add zentry',
  bun: 'bun add zentry',
};

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)">
        {label}
      </p>
      <p className="break-all font-mono text-sm text-(--sea-ink) dark:text-slate-100">{value}</p>
    </div>
  );
}

function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className={cn(
        'border border-slate-300 bg-white/80 text-slate-600 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
        className,
      )}
      aria-label={`Copy ${label}`}
      onClick={handleCopy}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  );
}

function CodePanel({
  eyebrow,
  title,
  description,
  lines,
}: {
  eyebrow: string;
  title: string;
  description: string;
  lines: string[];
}) {
  const joinedValue = lines.join('\n');

  return (
    <Card className="overflow-hidden border border-(--line) bg-(--surface) py-0 shadow-none ring-0">
      <CardHeader className="gap-3 border-b border-(--line) bg-linear-to-r from-slate-100 via-slate-50 to-slate-100 py-5 text-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              {eyebrow}
            </p>
            <CardTitle className="text-base tracking-widest text-slate-950 dark:text-white">
              {title}
            </CardTitle>
            <CardDescription className="max-w-2xl text-slate-600 dark:text-slate-300">
              {description}
            </CardDescription>
          </div>
          <CopyButton value={joinedValue} label={title} className="shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto bg-slate-100 px-0 py-0 dark:bg-slate-950">
        <pre className="min-w-full px-6 py-5 font-mono text-sm leading-7 text-slate-800 dark:text-slate-100">
          <code>
            {lines.map((line) => (
              <span key={line} className="block whitespace-pre">
                {line}
              </span>
            ))}
          </code>
        </pre>
      </CardContent>
    </Card>
  );
}

function ProjectOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-(--line) bg-(--surface) shadow-none ring-0">
        <CardHeader className="gap-4 border-b border-(--line) pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <Skeleton className="size-16 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-56" />
                <Skeleton className="h-4 w-72" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full min-w-28" />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 py-6 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      {Array.from({ length: 3 }).map((_, index) => (
        <Card
          key={index}
          className="overflow-hidden border border-(--line) bg-(--surface) py-0 shadow-none ring-0"
        >
          <CardHeader className="gap-3 border-b border-(--line) bg-slate-100 py-5 dark:bg-slate-950">
            <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-white/10" />
            <Skeleton className="h-5 w-40 bg-slate-200 dark:bg-white/10" />
            <Skeleton className="h-4 w-full max-w-xl bg-slate-200 dark:bg-white/10" />
          </CardHeader>
          <CardContent className="bg-slate-100 px-6 py-5 dark:bg-slate-950">
            {Array.from({ length: 4 }).map((__, lineIndex) => (
              <Skeleton
                key={lineIndex}
                className="mb-3 h-4 w-full bg-slate-200 last:mb-0 dark:bg-white/10"
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProjectOverviewError({ message }: { message: string }) {
  return (
    <Card className="border border-destructive/20 bg-destructive/10 shadow-none ring-0">
      <CardContent className="flex items-start gap-4 py-6">
        <div className="flex size-10 shrink-0 items-center justify-center border border-destructive/20 bg-destructive/10 text-destructive">
          <TriangleAlert className="size-4" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-lg font-semibold tracking-[0.08em] text-destructive">
            Unable to load project details
          </h2>
          <p className="text-sm leading-6 text-destructive/80">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectOverview({ data, isPending }: { data?: OrgResponse; isPending: boolean }) {
  const [packageManager, setPackageManager] = useState<PackageManager>('npm');

  if (isPending || !data) {
    return <ProjectOverviewSkeleton />;
  }

  const environmentLines = [
    `ZENTRY_ORG_ID="${data.id}"`,
    `ZENTRY_API_KEY_RAW="${data.apiKeyRow}"`,
    `ZENTRY_API_KEY_HASH="${data.apiKeyHash}"`,
    `ZENTRY_API_KEY_PREFIX="${data.apiKeyPrefix}"`,
  ];

  const homeUrlLines =
    data.appHomeUrl.length > 0
      ? data.appHomeUrl.map((url, _index) => `ZENTRY_APP_HOME_URL="${url}"`)
      : ['# No home URLs configured yet'];

  const callbackUrlLines =
    data.appCallbackUrl.length > 0
      ? data.appCallbackUrl.map((url, _index) => `ZENTRY_APP_CALLBACK_URL="${url}"`)
      : ['# No callback URLs configured yet'];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-(--line) bg-(--surface) shadow-none ring-0">
        <CardHeader className="gap-5 border-b border-(--line) bg-linear-to-r from-white via-white to-(--surface) pb-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <Avatar size="lg" className="size-16 border border-(--line) bg-(--surface-strong)">
                <AvatarImage src={data.logoUrl ?? undefined} alt={data.name} />
                <AvatarFallback className="bg-primary/10 font-semibold uppercase text-primary">
                  {getInitials(data.name) || 'O'}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)">
                  Framework Setup
                </p>
                <div>
                  <h1 className="font-heading text-3xl font-semibold tracking-[0.08em] text-(--sea-ink) dark:text-slate-100">
                    {data.name}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-(--sea-ink-soft)">
                    Use these organization details to wire your app like framework documentation.
                    The membership table comes next. This first step focuses on installation,
                    environment variables, and endpoint URLs.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card className="border border-(--line) bg-white/70 py-4 shadow-none ring-0 dark:bg-slate-950/60">
                <CardContent className="space-y-2 px-4">
                  <Package2 className="size-4 text-(--sea-ink-soft)" />
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)">
                    Package
                  </p>
                  <p className="font-mono text-sm text-(--sea-ink) dark:text-slate-100">zentry</p>
                </CardContent>
              </Card>
              <Card className="border border-(--line) bg-white/70 py-4 shadow-none ring-0 dark:bg-slate-950/60">
                <CardContent className="space-y-2 px-4">
                  <Building2 className="size-4 text-(--sea-ink-soft)" />
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)">
                    Members
                  </p>
                  <p className="font-mono text-sm text-(--sea-ink) dark:text-slate-100">
                    {data.memberships.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-(--line) bg-white/70 py-4 shadow-none ring-0 dark:bg-slate-950/60">
                <CardContent className="space-y-2 px-4">
                  <Globe className="size-4 text-(--sea-ink-soft)" />
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)">
                    Home URLs
                  </p>
                  <p className="font-mono text-sm text-(--sea-ink) dark:text-slate-100">
                    {data.appHomeUrl.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border border-(--line) bg-white/70 py-4 shadow-none ring-0 dark:bg-slate-950/60">
                <CardContent className="space-y-2 px-4">
                  <Shield className="size-4 text-(--sea-ink-soft)" />
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)">
                    Key Prefix
                  </p>
                  <p className="font-mono text-sm text-(--sea-ink) dark:text-slate-100">
                    {data.apiKeyPrefix}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 py-6 md:grid-cols-2">
          <DetailItem label="Organization ID" value={data.id} />
          <DetailItem label="Root Admin ID" value={data.rootAdminId} />
          <DetailItem label="Created At" value={formatDate(data.createdAt)} />
          <DetailItem label="Updated At" value={formatDate(data.updatedAt)} />
          <DetailItem label="Logo URL" value={data.logoUrl ?? 'No logo configured'} />
          <DetailItem label="Organization Name" value={data.name} />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)">
            Installation
          </p>
          <h2 className="font-heading text-2xl font-semibold tracking-[0.08em] text-(--sea-ink) dark:text-slate-100">
            Add the SDK command your team uses
          </h2>
        </div>

        <Card className="overflow-hidden border border-(--line) bg-(--surface) py-0 shadow-none ring-0">
          <CardHeader className="gap-4 border-b border-(--line) py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base tracking-widest text-(--sea-ink) dark:text-slate-100">
                  Install Zentry
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-(--sea-ink-soft)">
                  Pick the package manager that matches your workflow. This is visual-only for now,
                  just like framework docs.
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                {(['npm', 'pnpm', 'bun'] as PackageManager[]).map((manager) => (
                  <Button
                    key={manager}
                    type="button"
                    variant={packageManager === manager ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => setPackageManager(manager)}
                  >
                    {manager}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="bg-slate-100 px-0 py-0 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-3 dark:border-white/10">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Terminal
              </p>
              <CopyButton
                value={packageManagerCommands[packageManager]}
                label={`${packageManager} install command`}
              />
            </div>
            <pre className="overflow-x-auto px-6 py-5 font-mono text-sm leading-7 text-slate-800 dark:text-slate-100">
              <code>{packageManagerCommands[packageManager]}</code>
            </pre>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)">
            Environment
          </p>
          <h2 className="font-heading text-2xl font-semibold tracking-[0.08em] text-(--sea-ink) dark:text-slate-100">
            Copy the organization secrets
          </h2>
        </div>

        <CodePanel
          eyebrow="Secrets"
          title="Environment Variables"
          description="These values are rendered like framework documentation so users can copy and paste them straight into local setup files."
          lines={environmentLines}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <CodePanel
          eyebrow="Routing"
          title="Home URLs"
          description="These are the configured app entry points for this organization."
          lines={homeUrlLines}
        />
        <CodePanel
          eyebrow="Auth Flow"
          title="Callback URLs"
          description="Use these redirect targets when wiring OAuth or app callback behavior."
          lines={callbackUrlLines}
        />
      </section>
    </div>
  );
}
