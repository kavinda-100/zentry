import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { type UpdateOrgSchemaType, updateOrgSchema } from '@zentry/validation';
import { CircleAlert, Loader2, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import GoBack from '#/components/dashboard/GoBack.tsx';
import { SectionWrapper } from '#/components/dashboard/SectionWrapper.tsx';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '#/components/ui/alert.tsx';
import { Button } from '#/components/ui/button.tsx';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '#/components/ui/field.tsx';
import { Input } from '#/components/ui/input.tsx';
import { Skeleton } from '#/components/ui/skeleton.tsx';
import { useGetOrgById } from '#/hooks/org/useGetOrgById.ts';
import { useUpdateOrg } from '#/hooks/org/useUpdateOrg.ts';

const urlInputSchema = z.union([z.literal(''), updateOrgSchema.shape.logoUrl.unwrap()]);

const updateOrgFormSchema = z.object({
  name: updateOrgSchema.shape.name.unwrap(),
  logoUrl: urlInputSchema,
  appHomeUrls: z.array(urlInputSchema),
  appCallbackUrls: z.array(urlInputSchema),
});

type UpdateOrgFormValues = z.infer<typeof updateOrgFormSchema>;

const createDefaultValues = (): UpdateOrgFormValues => ({
  name: '',
  logoUrl: '',
  appHomeUrls: [],
  appCallbackUrls: [],
});

const mapOrgToFormValues = (
  org: NonNullable<ReturnType<typeof useGetOrgById>['data']>['data'],
): UpdateOrgFormValues => ({
  name: org.name,
  logoUrl: org.logoUrl ?? '',
  appHomeUrls: org.appHomeUrl,
  appCallbackUrls: org.appCallbackUrl,
});

const EditOrgPageSkeleton = () => {
  return (
    <SectionWrapper header="Project Docs" title="Edit Organization">
      <div className="border border-(--line) bg-(--surface) p-6 shadow-none ring-0">
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>

          <div className="space-y-4 border border-(--line) p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-9 w-36" />
          </div>

          <div className="space-y-4 border border-(--line) p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-9 w-40" />
          </div>

          <div className="flex items-center justify-between border-t border-(--line) pt-6">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export const Route = createFileRoute('/dashboard/projects/$projectId/edit/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAlert, setShowAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutate, isPending: isUpdating } = useUpdateOrg(projectId);
  const { data, isPending: isLoadingOrg, isError, error } = useGetOrgById(projectId);

  const formId = 'edit-org-form';
  const form = useForm<UpdateOrgFormValues>({
    resolver: standardSchemaResolver(updateOrgFormSchema),
    defaultValues: createDefaultValues(),
  });

  const appHomeUrlFields = form.watch('appHomeUrls');
  const appCallbackUrlFields = form.watch('appCallbackUrls');

  useEffect(() => {
    if (!data?.data) {
      return;
    }

    form.reset(mapOrgToFormValues(data.data));
    setShowAlert(false);
    setErrorMessage(null);
  }, [data, form]);

  function appendAppHomeUrl() {
    form.setValue('appHomeUrls', [...form.getValues('appHomeUrls'), ''], {
      shouldDirty: true,
    });
  }

  function removeAppHomeUrl(index: number) {
    form.setValue(
      'appHomeUrls',
      form.getValues('appHomeUrls').filter((_, itemIndex) => itemIndex !== index),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function appendAppCallbackUrl() {
    form.setValue('appCallbackUrls', [...form.getValues('appCallbackUrls'), ''], {
      shouldDirty: true,
    });
  }

  function removeAppCallbackUrl(index: number) {
    form.setValue(
      'appCallbackUrls',
      form.getValues('appCallbackUrls').filter((_, itemIndex) => itemIndex !== index),
      { shouldDirty: true, shouldValidate: true },
    );
  }

  function resetForm() {
    if (!data?.data) {
      form.reset(createDefaultValues());
      return;
    }

    form.reset(mapOrgToFormValues(data.data));
    setShowAlert(false);
    setErrorMessage(null);
  }

  function onSubmit(values: UpdateOrgFormValues) {
    const sanitizedData: UpdateOrgSchemaType = {
      name: values.name.trim(),
      logoUrl: (values.logoUrl ?? '').trim() || undefined,
      appHomeUrls: values.appHomeUrls.map((url) => (url ?? '').trim()).filter(Boolean),
      appCallbackUrls: values.appCallbackUrls.map((url) => (url ?? '').trim()).filter(Boolean),
    };

    setShowAlert(false);
    setErrorMessage(null);

    mutate(sanitizedData, {
      onError: (mutationError) => {
        setShowAlert(true);
        setErrorMessage(mutationError.message ?? 'Something went wrong. Please try again later.');
      },
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['org', projectId] }),
          queryClient.invalidateQueries({ queryKey: ['user-orgs'] }),
        ]);

        await navigate({
          to: '/dashboard/projects/$projectId',
          params: { projectId },
        });
      },
    });
  }

  if (isLoadingOrg) {
    return (
      <section className="flex w-full flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
        <GoBack />
        <EditOrgPageSkeleton />
      </section>
    );
  }

  if (isError || !data?.data) {
    return (
      <section className="flex w-full flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
        <GoBack />
        <SectionWrapper header="Project Docs" title="Edit Organization">
          <Alert
            variant="destructive"
            className="border-destructive/20 bg-destructive/10 shadow-none"
          >
            <CircleAlert className="mt-0.5 size-4" />
            <AlertTitle className="tracking-[0.14em] uppercase">
              Unable to load organization
            </AlertTitle>
            <AlertDescription className="leading-6 text-destructive/80">
              {error?.message ?? 'Something went wrong while loading organization details.'}
            </AlertDescription>
            <AlertAction>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['org', projectId] })}
              >
                <RefreshCw className="size-3.5" />
                Retry
              </Button>
            </AlertAction>
          </Alert>
        </SectionWrapper>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
      <GoBack />

      <SectionWrapper header="Project Docs" title="Edit Organization">
        <div className="border border-(--line) bg-(--surface) shadow-none ring-0">
          <div className="border-b border-(--line) px-6 py-6">
            <div className="space-y-3">
              <h2 className="text-3xl tracking-[0.18em]">Update organization details</h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Keep your branding and auth URLs up to date across local development and production
                environments.
              </p>
            </div>

            {showAlert && (
              <Alert
                variant="destructive"
                className="mt-4 border-destructive/30 bg-destructive/8 shadow-sm backdrop-blur-sm"
              >
                <CircleAlert className="mt-0.5 size-4" />
                <AlertTitle className="tracking-[0.14em] uppercase">
                  Organization update failed
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
          </div>

          <div className="px-6 py-6">
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FieldGroup className="gap-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="edit-org-name">Organization name</FieldLabel>
                        <Input
                          {...field}
                          id="edit-org-name"
                          aria-invalid={fieldState.invalid}
                          placeholder="Zentry Inc."
                          autoComplete="organization"
                          disabled={isUpdating}
                        />
                        <FieldDescription>Name of the Organization</FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name="logoUrl"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="edit-org-logo-url">Logo URL</FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          id="edit-org-logo-url"
                          aria-invalid={fieldState.invalid}
                          placeholder="https://example.com/logo.png"
                          autoComplete="url"
                          type="url"
                          disabled={isUpdating}
                        />
                        <FieldDescription>
                          Optional. Use a hosted logo for your organization branding.
                        </FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <FieldGroup className="gap-4 border border-foreground/10 p-5">
                  <div className="space-y-1">
                    <h3 className="font-heading text-sm font-semibold uppercase tracking-[0.18em]">
                      App home URLs
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Add one or more app entry URLs, like your local dev app and production app.
                    </p>
                  </div>

                  {appHomeUrlFields.length > 0 ? (
                    <div className="space-y-4">
                      {appHomeUrlFields.map((_, index) => (
                        <Controller
                          key={`app-home-url-${index}`}
                          name={`appHomeUrls.${index}` as const}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel htmlFor={`edit-org-home-url-${index}`}>
                                Home URL {index + 1}
                              </FieldLabel>
                              <div className="flex gap-3">
                                <Input
                                  {...field}
                                  value={field.value ?? ''}
                                  id={`edit-org-home-url-${index}`}
                                  aria-invalid={fieldState.invalid}
                                  placeholder={
                                    index === 0
                                      ? 'http://localhost:3000'
                                      : 'https://app.example.com'
                                  }
                                  autoComplete="url"
                                  type="url"
                                  disabled={isUpdating}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label={`Remove home URL ${index + 1}`}
                                  onClick={() => removeAppHomeUrl(index)}
                                  disabled={isUpdating}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-foreground/15 px-4 py-5 text-sm text-muted-foreground">
                      No home URLs added yet. Add your local or deployed app URL to get started.
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    onClick={appendAppHomeUrl}
                    disabled={isUpdating}
                  >
                    <Plus className="size-4" />
                    Add home URL
                  </Button>
                </FieldGroup>

                <FieldGroup className="gap-4 border border-foreground/10 p-5">
                  <div className="space-y-1">
                    <h3 className="font-heading text-sm font-semibold uppercase tracking-[0.18em]">
                      Callback URLs
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Add every OAuth or auth callback URL your app needs in development and
                      production.
                    </p>
                  </div>

                  {appCallbackUrlFields.length > 0 ? (
                    <div className="space-y-4">
                      {appCallbackUrlFields.map((_, index) => (
                        <Controller
                          key={`app-callback-url-${index}`}
                          name={`appCallbackUrls.${index}` as const}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel htmlFor={`edit-org-callback-url-${index}`}>
                                Callback URL {index + 1}
                              </FieldLabel>
                              <div className="flex gap-3">
                                <Input
                                  {...field}
                                  value={field.value ?? ''}
                                  id={`edit-org-callback-url-${index}`}
                                  aria-invalid={fieldState.invalid}
                                  placeholder={
                                    index === 0
                                      ? 'http://localhost:3000/api/auth/callback'
                                      : 'https://app.example.com/api/auth/callback'
                                  }
                                  autoComplete="url"
                                  type="url"
                                  disabled={isUpdating}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label={`Remove callback URL ${index + 1}`}
                                  onClick={() => removeAppCallbackUrl(index)}
                                  disabled={isUpdating}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                          )}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-foreground/15 px-4 py-5 text-sm text-muted-foreground">
                      No callback URLs added yet. Add the redirect URLs used by your auth flow.
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit"
                    onClick={appendAppCallbackUrl}
                    disabled={isUpdating}
                  >
                    <Plus className="size-4" />
                    Add callback URL
                  </Button>
                </FieldGroup>
              </FieldGroup>
            </form>
          </div>

          <div className="flex flex-col gap-3 border-t border-(--line) px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={resetForm} disabled={isUpdating}>
              Reset
            </Button>
            <Button type="submit" form={formId} className="min-w-36" disabled={isUpdating}>
              {isUpdating ? <Loader2 className="size-4 animate-spin" /> : 'Save changes'}
            </Button>
          </div>
        </div>
      </SectionWrapper>
    </section>
  );
}
