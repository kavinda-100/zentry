import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
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
import { CircleAlert, Loader2, X } from 'lucide-react';
import { useLocalStorage } from '#/hooks/useLocalStorage.ts';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useState } from 'react';
import { LAST_AUTHENTICATED_METHOD, SESSION_TOKEN_KEY } from '#/constants';
import GoogleButton from '#/components/auth/GoogleButton.tsx';
import AuthLastBadge from '#/components/auth/AuthLastBadge.tsx';
import type { LastAuthenticatedMethodType } from '#/types';
import { useRegister } from '#/hooks/auth/useRegister.ts';

export const Route = createFileRoute('/(auth)/register')({
  component: RegisterComponent,
});

function RegisterComponent() {
  const [showAlert, setShowAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isPending, mutate } = useRegister();
  const navigate = useNavigate();
  const { setItemToLocalStorage, getItemFromLocalStorage } = useLocalStorage();
  const lastAuthenticatedMethod =
    getItemFromLocalStorage<LastAuthenticatedMethodType>(LAST_AUTHENTICATED_METHOD);

  const formId = 'register-form';
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

  async function onSubmit(data: RegisterSchemaType) {
    console.info(data);
    setShowAlert(false);
    setErrorMessage(null);
    mutate(data, {
      onError: (error) => {
        console.error('Error:', error);
        setShowAlert(true);
        setErrorMessage(error.message ?? 'Something went wrong. Please try again later.');
      },
      onSuccess: async (response, variables) => {
        console.log('register response:', response);
        setItemToLocalStorage<string>(SESSION_TOKEN_KEY, response.data.session.token);
        setItemToLocalStorage<LastAuthenticatedMethodType>(LAST_AUTHENTICATED_METHOD, 'credential');
        await navigate({
          to: '/verify-email',
          search: {
            email: variables.email,
          },
        });
      },
    });
  }

  return (
    <Card className="w-full max-w-xl border border-foreground/10 bg-background/95 shadow-xl">
      <CardHeader className="gap-3 border-b border-foreground/10">
        <CardTitle className="text-3xl tracking-[0.18em]">Create an account</CardTitle>
        <CardDescription className="max-w-md text-sm">
          Set up your Zentry account with your basic details and a secure password.
        </CardDescription>

        {/*  error Alert*/}
        {showAlert && (
          <Alert
            variant="destructive"
            className="mt-2 border-destructive/30 bg-destructive/[0.08] shadow-sm backdrop-blur-sm"
          >
            <CircleAlert className="mt-0.5 size-4" />
            <AlertTitle className="tracking-[0.14em] uppercase">Registration failed</AlertTitle>
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
                    disabled={isPending}
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
                    disabled={isPending}
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
                    disabled={isPending}
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
          <Button type="button" variant="outline" onClick={() => form.reset()} disabled={isPending}>
            Reset
          </Button>
          <div className="relative">
            {lastAuthenticatedMethod === 'credential' ? <AuthLastBadge /> : null}
            <Button type="submit" form={formId} className="min-w-32" disabled={isPending}>
              {isPending ? <Loader2 className={'size-4 animate-spin'} /> : 'Create account'}
            </Button>
          </div>
        </Field>

        {/*  google button*/}
        <GoogleButton
          setShowAlert={setShowAlert}
          setErrorMessage={setErrorMessage}
          classnames="mt-3"
        />

        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
            Login here
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
