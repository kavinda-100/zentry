import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import AuthLayout from '#/layouts/AuthLayout.tsx';
import { registerSchema, type RegisterSchemaType } from '@zentry/validation';
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
import { faker } from '@faker-js/faker';

export const Route = createFileRoute('/(auth)/register')({
  component: RegisterComponent,
});

function RegisterComponent() {
  const formId = 'register-form';
  const navigate = useNavigate();
  const form = useForm<RegisterSchemaType>({
    resolver: standardSchemaResolver(registerSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      imageUrl: faker.image.avatarGitHub(),
      password: '',
    },
  });

  function onSubmit(data: RegisterSchemaType) {
    // Do something with the form values.
    console.info(data);
    void navigate({
      to: '/verify-email',
      search: {
        email: data.email,
      },
    });
  }

  return (
    <AuthLayout>
      <Card className="w-full max-w-xl border border-foreground/10 bg-background/95 shadow-xl">
        <CardHeader className="gap-3 border-b border-foreground/10">
          <CardTitle className="text-3xl tracking-[0.18em]">Create an account</CardTitle>
          <CardDescription className="max-w-md text-sm">
            Set up your Zentry account with your basic details and a secure password.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FieldGroup className="gap-6">
              <Controller
                name="firstName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-first-name">First name</FieldLabel>
                    <Input
                      {...field}
                      id="register-first-name"
                      aria-invalid={fieldState.invalid}
                      placeholder="Kavinda"
                      autoComplete="given-name"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="lastName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-last-name">Last name</FieldLabel>

                    <Input
                      {...field}
                      id="register-last-name"
                      aria-invalid={fieldState.invalid}
                      placeholder="Perera"
                      autoComplete="family-name"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-email">Email</FieldLabel>

                    <Input
                      {...field}
                      id="register-email"
                      aria-invalid={fieldState.invalid}
                      placeholder="name@example.com"
                      autoComplete="email"
                      type="email"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              {/*<Controller*/}
              {/*  name="imageUrl"*/}
              {/*  control={form.control}*/}
              {/*  render={({ field, fieldState }) => (*/}
              {/*    <Field data-invalid={fieldState.invalid}>*/}
              {/*      <FieldLabel htmlFor="register-image-url">Profile image URL</FieldLabel>*/}
              {/*      <Input*/}
              {/*        {...field}*/}
              {/*        value={field.value ?? ''}*/}
              {/*        id="register-image-url"*/}
              {/*        aria-invalid={fieldState.invalid}*/}
              {/*        placeholder="https://example.com/avatar.jpg"*/}
              {/*        autoComplete="url"*/}
              {/*        type="url"*/}
              {/*      />*/}
              {/*      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}*/}
              {/*    </Field>*/}
              {/*  )}*/}
              {/*/>*/}
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-password">Password</FieldLabel>
                    <Input
                      {...field}
                      id="register-password"
                      aria-invalid={fieldState.invalid}
                      placeholder="Enter a secure password"
                      autoComplete="new-password"
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
              Create account
            </Button>
          </Field>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
              Login here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
