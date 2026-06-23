import { createFileRoute, Link } from '@tanstack/react-router';
import { orgUserVerifyEmailSchema, type OrgUserVerifyEmailSchemaType } from '@zentry/validation';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { useEffect, useState } from 'react';
import { useOrgUserEmailVerify } from '#/hooks/org/auth/useOrgUserEmailVerify.ts';
import { toast } from 'sonner';
import { buildCallbackUrlWithToken, storeSessionToken } from '#/hooks/auth/authentication.ts';

export const Route = createFileRoute('/org/verify-email')({
  ssr: false,
  validateSearch: z.object({
    email: z.email(),
    orgId: z.string(),
    token: z.string(),
    callbackUrl: z.string(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const [count, setCount] = useState(10 * 60 * 1000);
  const search = Route.useSearch();
  const { mutate } = useOrgUserEmailVerify();

  if (!search.orgId || !search.token || !search.callbackUrl) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-center text-sm text-muted-foreground">
          Missing verification context. Please restart the sign-in flow.
        </p>
      </div>
    );
  }

  const formId = 'org-verify-email-form';
  const form = useForm<OrgUserVerifyEmailSchemaType>({
    resolver: standardSchemaResolver(orgUserVerifyEmailSchema),
    defaultValues: {
      email: search.email ?? '',
      otp: '',
    },
  });

  function onSubmit(inputs: OrgUserVerifyEmailSchemaType) {
    mutate(
      {
        orgId: search.orgId,
        callbackUrl: search.callbackUrl,
        data: inputs,
      },
      {
        onSuccess: (data) => {
          storeSessionToken(data.data.session.token);

          if (data.data.shouldRedirect) {
            window.location.assign(
              buildCallbackUrlWithToken(data.data.callbackUrl, data.data.session.token),
            );
          }
        },
        onError: (error) => {
          console.error('Error verifying org user email:', error);
          toast.error('Failed to verify email. Please try again.');
        },
      },
    );
  }

  useEffect(() => {
    storeSessionToken(search.token);
  }, [search.token]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (count <= 0) return clearInterval(interval);
      setCount((prevCount) => prevCount - 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [count]);

  return (
    <Card className="w-full max-w-xl border border-foreground/10 bg-background/95 shadow-xl">
      <CardHeader className="gap-3 border-b border-foreground/10">
        <CardTitle className="text-3xl tracking-[0.18em]">Verify your email</CardTitle>
        <CardDescription className="max-w-md text-sm">
          Enter the email address you signed up with and the 6-digit code we sent to your inbox.
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
                  <FieldLabel htmlFor="org-verify-email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="org-verify-email"
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
              name="otp"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="org-verify-otp">Verification code</FieldLabel>
                  <Input
                    {...field}
                    id="org-verify-otp"
                    aria-invalid={fieldState.invalid}
                    placeholder="123456"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={6}
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
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              form.reset({
                email: search.email ?? '',
                otp: '',
              })
            }
          >
            Reset
          </Button>
          <Button type="submit" form={formId} className="min-w-32">
            Verify email
          </Button>
        </Field>
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the code?{' '}
          <button
            type="button"
            onClick={() => console.log('resend email')}
            className="cursor-pointer font-medium text-foreground underline underline-offset-4"
          >
            Resend
          </button>
        </p>

        <p className="text-sm text-muted-foreground">
          {count > 0 ? (
            <span className="text-sm text-muted-foreground">
              Code expires in {Math.floor(count / 1000 / 60)} minutes and{' '}
              {Math.floor(count / 1000) % 60} seconds
            </span>
          ) : (
            <span className="text-sm text-destructive">Code expired</span>
          )}
        </p>

        <p className="text-sm text-muted-foreground">
          Need to go back?{' '}
          <Link
            to="/org/login"
            search={{ callbackUrl: search.callbackUrl, orgId: search.orgId }}
            className="font-medium text-foreground underline underline-offset-4"
          >
            Return to login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
