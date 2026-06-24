import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { orgUserLoginSchema, type OrgUserLoginSchemaType } from '@zentry/validation';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Controller, useForm } from 'react-hook-form';
import { FcGoogle } from 'react-icons/fc';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useOrgUserLogIn } from '#/hooks/org/auth/useOrgUserLogIn.ts';
import { toast } from 'sonner';
import {
  buildCallbackUrlWithCode,
  storeOrgVerificationFlow,
} from '#/hooks/auth/authentication.ts';

export const Route = createFileRoute('/org/login')({
  ssr: false,
  validateSearch: z.object({
    callbackUrl: z.string().optional(),
    orgId: z.string().optional(),
    state: z.string().optional(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { callbackUrl, orgId, state } = Route.useSearch();

  if (!orgId || !callbackUrl || !state) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-center text-sm text-muted-foreground">
          Invalid organization ID or callback URL. Please try again.
        </p>
      </div>
    );
  }

  const navigate = useNavigate();
  const { mutate } = useOrgUserLogIn();

  const formId = 'org-login-form';
  const form = useForm<OrgUserLoginSchemaType>({
    resolver: standardSchemaResolver(orgUserLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(inputs: OrgUserLoginSchemaType) {
    mutate(
        {
          orgId: orgId!,
          callbackUrl: callbackUrl!,
          state: state!,
          data: inputs,
        },
      {
        onSuccess: async (data) => {
          toast.success('Signed in successfully!');
          await new Promise((resolve) => setTimeout(resolve, 2000));

          if (data.data.status === 'PENDING_EMAIL_VERIFICATION') {
            storeOrgVerificationFlow(data.data.verificationFlowId);
            await navigate({
              to: '/org/verify-email',
              search: {
                email: data.data.email,
                orgId: orgId!,
                callbackUrl: data.data.callbackUrl,
                state: data.data.state,
              },
            });
            return;
          }

          window.location.assign(
            buildCallbackUrlWithCode(data.data.callbackUrl, data.data.code, data.data.state),
          );
        },
        onError: (error) => {
          console.error('Error logging in org user:', error);
          toast.error('Failed to sign in. Please try again.');
        },
      },
    );
  }

  return (
    <Card className="w-full max-w-xl border border-foreground/10 bg-background/95 shadow-xl">
      <CardHeader className="gap-3 border-b border-foreground/10">
        <CardTitle className="text-3xl tracking-[0.18em]">Welcome back</CardTitle>
        <CardDescription className="max-w-md text-sm">
          Sign in to your organization account to continue managing access and identity.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FieldGroup className="gap-6">
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="org-login-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="org-login-email"
                    aria-invalid={fieldState.invalid}
                    placeholder="name@example.com"
                    autoComplete="email"
                    type="email"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="org-login-password">Password</FieldLabel>
                  <Input
                    {...field}
                    id="org-login-password"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    type="password"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-4 border-t border-foreground/10 pt-6">
        <Field orientation="horizontal" className="justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" form={formId} className="min-w-32">
            Sign in
          </Button>
        </Field>

        <div className="mt-3 flex w-full flex-col gap-3">
          <p className="text-center text-xs text-muted-foreground">Or</p>
          <Button type="button" className="w-full cursor-pointer" variant="outline">
            <FcGoogle className="h-5 w-5" />
            Continue with Google
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            to="/org/register"
            search={{ callbackUrl, orgId, state }}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Register here
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
