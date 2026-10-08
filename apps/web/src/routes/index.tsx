import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  getIsAuthenticatedQueryOptions,
  getStoredSessionToken,
} from '#/hooks/auth/authentication.ts';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Blocks,
  BookOpen,
  Building2,
  CodeXml,
  Fingerprint,
  KeyRound,
  MailCheck,
  Monitor,
  RotateCcw,
  Server,
  ShieldCheck,
  Terminal,
  Users,
} from 'lucide-react';
import { ModeToggle } from '#/components/ModeToggle.tsx';
import { Button } from '#/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx';

export const Route = createFileRoute('/')({ component: Home });

const features = [
  {
    icon: Fingerprint,
    title: 'Hosted sign-in',
    description:
      'Give users a place to register and sign in with email and password, scoped to your organization.',
  },
  {
    icon: KeyRound,
    title: 'Google OAuth',
    description:
      'Let users sign in with their Google account through Zentry’s hosted authentication flow.',
  },
  {
    icon: MailCheck,
    title: 'Email verification',
    description:
      'Verify email addresses with a one-time code before completing the organization sign-in flow.',
  },
  {
    icon: Building2,
    title: 'Organization management',
    description:
      'Create app workspaces and configure organization branding, home URLs, and allowed callback URLs.',
  },
  {
    icon: Users,
    title: 'Member controls',
    description:
      'Manage member roles and permissions. Ban or remove members from an organization when access needs to change.',
  },
  {
    icon: RotateCcw,
    title: 'Revocable sessions',
    description:
      'Revoke a member’s organization sessions from the dashboard, with Redis-backed session validation.',
  },
];

const authFlow = [
  {
    icon: Monitor,
    title: 'Your app',
    label: 'Start sign-in',
    description: 'The SDK redirects with your organization, callback URL, and state.',
  },
  {
    icon: Fingerprint,
    title: 'Zentry sign-in',
    label: 'Authenticate',
    description:
      'Users sign in with email and password or Google. Email verification happens here.',
  },
  {
    icon: ArrowDown,
    title: 'Your callback',
    label: 'Establish a session',
    description: 'The SDK checks the returned state and exchanges the one-time code for a session.',
  },
  {
    icon: Server,
    title: 'Your API',
    label: 'Validate access',
    description: 'Your backend validates the user token with your organization ID and API key.',
  },
];

const setupSteps = [
  {
    title: 'Create a project',
    description: 'Create your Zentry account, then add an organization for your app.',
  },
  {
    title: 'Configure your URLs',
    description: 'Register your app’s home and callback URLs in the project settings.',
  },
  {
    title: 'Connect the SDK',
    description:
      'Add the React provider to your frontend and session validation to your Node backend.',
  },
];

const boxClassName = 'min-w-0 border border-border shadow-none ring-0';
const anchorClassName =
  'inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring';

function AccountActions({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button size="lg" asChild>
        <Link to={isAuthenticated ? '/dashboard' : '/register'}>
          {isAuthenticated ? 'Go to dashboard' : 'Create an account'}
          <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
        </Link>
      </Button>
      <Button variant="outline" size="lg" asChild>
        <Link to="/docs">
          <BookOpen data-icon="inline-start" aria-hidden="true" />
          Read the docs
        </Link>
      </Button>
    </div>
  );
}

function AuthFlow() {
  return (
    <figure className="border border-border bg-card">
      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Blocks className="size-4" aria-hidden="true" />
          The integration flow
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          App → identity → session → API
        </span>
      </figcaption>
      <ol className="grid md:grid-cols-4">
        {authFlow.map(({ icon: Icon, title, label, description }, index) => (
          <li
            key={title}
            className="relative flex min-w-0 flex-col gap-5 border-border p-6 not-last:border-b md:not-last:border-r md:not-last:border-b-0 lg:p-8"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex size-11 items-center justify-center border border-border bg-muted">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="font-mono text-xs text-muted-foreground" aria-hidden="true">
                0{index + 1}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-heading text-lg font-semibold">{title}</h3>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
            {index < authFlow.length - 1 && (
              <span
                className="absolute -bottom-3 left-6 z-10 flex size-6 items-center justify-center border border-border bg-background md:top-8 md:-right-3 md:bottom-auto md:left-auto"
                aria-hidden="true"
              >
                <ArrowDown className="size-3 md:hidden" />
                <ArrowRight className="hidden size-3 md:block" />
              </span>
            )}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/40 px-5 py-4 text-xs leading-5 text-muted-foreground sm:px-6">
        <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
        <p>
          The callback returns <span className="font-mono text-foreground">code + state</span>. The
          SDK exchanges the code for the session token.
        </p>
      </div>
    </figure>
  );
}

function Home() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(getStoredSessionToken());
  }, []);

  const authentication = useQuery({
    ...getIsAuthenticatedQueryOptions(token ?? ''),
    enabled: Boolean(token),
    retry: false,
  });
  const isAuthenticated =
    !authentication.isError && authentication.data?.data.isAuthenticated === true;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only z-50 bg-background px-4 py-3 text-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-4 py-5 sm:px-6 lg:px-8">
          <Link
            to="/"
            aria-label="Zentry home"
            className="flex items-center gap-3 text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <span className="flex size-10 items-center justify-center border border-primary bg-primary text-primary-foreground">
              <Fingerprint className="size-6" aria-hidden="true" />
            </span>
            <span className="font-heading text-xl font-bold tracking-[0.12em]">ZENTRY</span>
          </Link>
          <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href="#features" className={anchorClassName}>
              Features
            </a>
            <a href="#how-it-works" className={anchorClassName}>
              How it works
            </a>
            <Link to="/docs" className={anchorClassName}>
              Documentation
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to={isAuthenticated ? '/dashboard' : '/login'} search={{ redirect: undefined }}>
                {isAuthenticated ? 'Go to dashboard' : 'Sign in'}
                <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
              </Link>
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <section
          aria-labelledby="hero-title"
          className="flex flex-col gap-12 py-12 sm:py-16 lg:gap-16 lg:py-24"
        >
          <div className="grid items-end gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
            <div className="flex flex-col items-start gap-6">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="size-2 bg-primary" aria-hidden="true" />
                Multi-tenant authentication
              </p>
              <h1
                id="hero-title"
                className="font-heading text-[clamp(2.6rem,5.5vw,5rem)] leading-[1.04] font-semibold tracking-[-0.05em]"
              >
                Authentication
                <br className="hidden sm:block" /> for your apps.
                <br />
                <span className="text-muted-foreground">
                  Sessions you
                  <br className="hidden sm:block" /> can control.
                </span>
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Give each app its own authentication workspace. Let Zentry handle hosted sign-in,
                email verification, and sessions while you build your frontend and API.
              </p>
              <AccountActions isAuthenticated={isAuthenticated} />
            </div>
            <Card className={boxClassName}>
              <CardHeader>
                <Building2 className="mb-3 size-6 text-muted-foreground" aria-hidden="true" />
                <CardTitle>
                  <h2>Organization-aware by design</h2>
                </CardTitle>
                <CardDescription>
                  Your app’s organization and its signed-in user travel together through the
                  authentication flow.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <CodeXml className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm">React on the frontend. Node on the backend.</p>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="text-sm">One shared session model across both.</p>
                </div>
              </CardContent>
              <CardFooter>
                <Link to="/docs" className={anchorClassName}>
                  Explore the SDK
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </CardFooter>
            </Card>
          </div>
          <AuthFlow />
        </section>
        <section
          id="features"
          aria-labelledby="features-title"
          className="flex scroll-mt-8 flex-col gap-8 border-t border-border py-12 sm:py-16 lg:py-20"
        >
          <div className="grid gap-4 md:grid-cols-2 md:items-end">
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Built into Zentry
              </p>
              <h2
                id="features-title"
                className="font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
              >
                From sign-in to access control.
              </h2>
            </div>
            <p className="max-w-lg text-base leading-7 text-muted-foreground md:justify-self-end">
              Configure your projects, manage their members, and keep control of the sessions that
              connect them.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className={boxClassName}>
                <CardHeader>
                  <Icon className="mb-4 size-6 text-muted-foreground" aria-hidden="true" />
                  <CardTitle>
                    <h3>{title}</h3>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-7 text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        <section
          id="how-it-works"
          aria-labelledby="setup-title"
          className="flex scroll-mt-8 flex-col gap-8 border-t border-border py-12 sm:py-16 lg:py-20"
        >
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Connect your app
            </p>
            <h2
              id="setup-title"
              className="font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
            >
              A workspace. A callback. Your code.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Start in the dashboard, then follow the SDK guide for your frontend and backend.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <ol className="flex flex-col border border-border">
              {setupSteps.map(({ title, description }, index) => (
                <li
                  key={title}
                  className="flex gap-4 border-border p-6 not-last:border-b sm:gap-6 sm:p-8"
                >
                  <span className="font-mono text-sm text-muted-foreground" aria-hidden="true">
                    0{index + 1}
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-heading text-lg font-semibold">{title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Card className={boxClassName}>
              <CardHeader>
                <Terminal className="mb-3 size-6 text-muted-foreground" aria-hidden="true" />
                <CardTitle>
                  <h3>Add the Zentry SDK</h3>
                </CardTitle>
                <CardDescription>
                  Use the same package in your React app and Node API.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <pre className="overflow-x-auto border border-border bg-muted p-5 text-sm leading-6">
                  <code>pnpm add @zentry-org/sdk</code>
                </pre>
                <dl className="flex flex-col gap-4 text-sm">
                  <div className="flex flex-col gap-2">
                    <dt className="font-semibold">React frontend</dt>
                    <dd className="wrap-anywhere font-mono text-muted-foreground">
                      @zentry-org/sdk/react
                    </dd>
                  </div>
                  <div className="flex flex-col gap-2">
                    <dt className="font-semibold">Node backend</dt>
                    <dd className="wrap-anywhere font-mono text-muted-foreground">
                      @zentry-org/sdk/node
                    </dd>
                  </div>
                </dl>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild>
                  <Link to="/docs">
                    View integration guide
                    <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>
        <section
          aria-labelledby="start-title"
          className="mb-12 flex flex-col gap-8 border border-border bg-muted/40 p-6 sm:mb-16 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:p-12"
        >
          <div className="flex max-w-xl flex-col gap-3">
            <h2
              id="start-title"
              className="font-heading text-3xl leading-tight font-semibold tracking-tight"
            >
              Build your app.
              <br />
              Connect its identity.
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              {isAuthenticated
                ? 'Open your dashboard to manage your projects, or explore the docs to connect your app.'
                : 'Create an account to set up your first project, or explore the docs to see how Zentry fits your stack.'}
            </p>
          </div>
          <AccountActions isAuthenticated={isAuthenticated} />
        </section>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div className="flex flex-col gap-2">
            <p className="font-heading text-sm font-bold tracking-[0.12em]">ZENTRY</p>
            <p className="text-sm text-muted-foreground">
              Organization-scoped authentication for your apps.
            </p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-6">
            <Link to="/docs" className={anchorClassName}>
              Documentation
            </Link>
            <Link to={isAuthenticated ? '/dashboard' : '/register'} className={anchorClassName}>
              {isAuthenticated ? 'Go to dashboard' : 'Create an account'}
            </Link>
            {!isAuthenticated && (
              <Link to="/login" search={{ redirect: undefined }} className={anchorClassName}>
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}
