import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import AuthLayout from '#/layouts/AuthLayout.tsx';
import { verifyEmailSchema, type VerifyEmailSchemaType } from '@zentry/validation';
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
import { useMutation } from '@tanstack/react-query';
import { verifyEmailServerFn } from '#/server-fns/auth';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CircleAlert, Loader2, X } from 'lucide-react';

export const Route = createFileRoute('/(auth)/verify-email')({
  validateSearch: z.object({
    email: z.email().optional(),
  }),
  component: VerifyEmailComponent,
});

function VerifyEmailComponent() {
  const navigate = useNavigate();
  const [count, setCount] = useState(10 * 60 * 1000); // 10 minutes in milliseconds
  const [showAlert, setShowAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // register mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: VerifyEmailSchemaType) => verifyEmailServerFn({ data }),
  });

  const formId = 'verify-email-form';
  const search = Route.useSearch();
  const form = useForm<VerifyEmailSchemaType>({
    resolver: standardSchemaResolver(verifyEmailSchema),
    defaultValues: {
      email: search.email ?? '',
      otp: '',
    },
  });

  async function onSubmit(data: VerifyEmailSchemaType) {
    console.info(data);
    setShowAlert(false);
    setErrorMessage(null);
    mutate(data, {
      onError: (error) => {
        console.error('Error:', error);
        setShowAlert(true);
        setErrorMessage(error.message ?? 'Something went wrong. Please try again later.');
      },
      onSuccess: async (response, _variables) => {
        console.log('verify-email response:', response);
        await navigate({
          to: '/overview',
        });
      },
    });
  }

  // Countdown timer for OTP expiration
  useEffect(() => {
    const interval = setInterval(() => {
      if (count <= 0) return clearInterval(interval);
      setCount((prevCount) => prevCount - 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [count]);

  return (
    <AuthLayout>
      <Card className="w-full max-w-xl border border-foreground/10 bg-background/95 shadow-xl">
        <CardHeader className="gap-3 border-b border-foreground/10">
          <CardTitle className="text-3xl tracking-[0.18em]">Verify your email</CardTitle>
          <CardDescription className="max-w-md text-sm">
            Enter the email address you signed up with and the 6-digit code we sent to your inbox.
          </CardDescription>

          {showAlert && (
            <Alert
              variant="destructive"
              className="mt-2 border-destructive/30 bg-destructive/[0.08] shadow-sm backdrop-blur-sm"
            >
              <CircleAlert className="mt-0.5 size-4" />
              <AlertTitle className="tracking-[0.14em] uppercase">
                Verification failed
              </AlertTitle>
              <AlertDescription className="leading-6 text-destructive/80">
                {errorMessage}
              </AlertDescription>
              <AlertAction>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Dismiss error message"
                  className="text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setShowAlert(false)}
                >
                  <X className="size-3.5" />
                </Button>
              </AlertAction>
            </Alert>
          )}
        </CardHeader>
        <CardContent className="pt-2">
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FieldGroup className="gap-6">
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="verify-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="verify-email"
                      aria-invalid={fieldState.invalid}
                      placeholder="name@example.com"
                      autoComplete="email"
                      type="email"
                      disabled={isPending}
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
                    <FieldLabel htmlFor="verify-otp">Verification code</FieldLabel>
                    <Input
                      {...field}
                      id="verify-otp"
                      aria-invalid={fieldState.invalid}
                      placeholder="123456"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      maxLength={6}
                      disabled={isPending}
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
              disabled={isPending}
            >
              Reset
            </Button>
            <Button type="submit" form={formId} className="min-w-32" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Verify email'}
            </Button>
          </Field>
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the code?{' '}
            <button
              type="button"
              onClick={() => console.log('resend email')}
              className="font-medium text-foreground underline underline-offset-4 cursor-pointer"
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
            <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
              Return to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
