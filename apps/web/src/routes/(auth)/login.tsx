import { createFileRoute, Link } from '@tanstack/react-router';
import AuthLayout from '#/layouts/AuthLayout.tsx';
import { loginSchema, type LoginSchemaType } from '@zentry/validation';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Controller, useForm } from 'react-hook-form';
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

export const Route = createFileRoute('/(auth)/login')({
  component: LogInComponent,
});

function LogInComponent() {
  const formId = 'login-form';
  const form = useForm<LoginSchemaType>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(data: LoginSchemaType) {
    // Do something with the form values.
    console.info(data);
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-xl border border-foreground/10 bg-background/95 shadow-xl">
        <CardHeader className="gap-3 border-b border-foreground/10">
          <CardTitle className="text-3xl tracking-[0.18em]">Welcome back</CardTitle>
          <CardDescription className="max-w-md text-sm">
            Sign in to your Zentry account to continue managing access and identity.
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
                    <FieldLabel htmlFor="login-email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="login-email"
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
                    <FieldLabel htmlFor="login-password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="login-password"
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
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Register here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
