import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { createOrgSchema, type CreateOrgSchemaType } from '@zentry/validation';
import { CircleAlert, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useCreateOrg } from '#/hooks/org/useCreateOrg.ts';
import { useQueryClient } from '@tanstack/react-query';

const urlInputSchema = z.union([z.literal(''), z.url()]);

const createOrgFormSchema = z.object({
  name: createOrgSchema.shape.name,
  logoUrl: urlInputSchema,
  appHomeUrls: z.array(urlInputSchema),
  appCallbackUrls: z.array(urlInputSchema),
});

type CreateOrgFormValues = z.infer<typeof createOrgFormSchema>;

const defaultValues = (): CreateOrgFormValues => ({
  name: '',
  logoUrl: '',
  appHomeUrls: [],
  appCallbackUrls: [],
});

const CreateAnOrganization = () => {
  const [showAlert, setShowAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const { isPending, mutate } = useCreateOrg();
  const queryClient = useQueryClient();
  const formId = 'create-org-form';
  const form = useForm<CreateOrgFormValues>({
    resolver: standardSchemaResolver(createOrgFormSchema),
    defaultValues: defaultValues(),
  });
  const appHomeUrlFields = form.watch('appHomeUrls');
  const appCallbackUrlFields = form.watch('appCallbackUrls');

  function resetForm() {
    form.reset(defaultValues());
    setShowAlert(false);
    setErrorMessage(null);
  }

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

  function onSubmit(data: CreateOrgFormValues) {
    const sanitizedData: CreateOrgSchemaType = {
      ...data,
      logoUrl: data.logoUrl?.trim() || undefined,
      appHomeUrls: data.appHomeUrls?.map((url) => url.trim()).filter(Boolean) || undefined,
      appCallbackUrls: data.appCallbackUrls?.map((url) => url.trim()).filter(Boolean) || undefined,
    };

    setShowAlert(false);
    setErrorMessage(null);

    mutate(sanitizedData, {
      onError: (error) => {
        setShowAlert(true);
        setErrorMessage(error.message ?? 'Something went wrong. Please try again later.');
      },
      onSuccess: async () => {
        resetForm();
        setOpen(false);
        // Invalidate the user or's query to fetch the updated list
        await queryClient.invalidateQueries({ queryKey: ['user-orgs'] });
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setShowAlert(false);
          setErrorMessage(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Create an Organization</Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 border border-foreground/10 bg-background/95 p-0 shadow-xl sm:max-w-4xl">
        <DialogHeader className="gap-3 border-b border-foreground/10 px-6 py-6">
          <DialogTitle className="text-3xl tracking-[0.18em]">Create an organization</DialogTitle>
          <DialogDescription className="max-w-2xl text-sm">
            Set up your organization details and add the app URLs you want to use across development
            and production.
          </DialogDescription>

          {showAlert && (
            <Alert
              variant="destructive"
              className="mt-2 border-destructive/30 bg-destructive/8 shadow-sm backdrop-blur-sm"
            >
              <CircleAlert className="mt-0.5 size-4" />
              <AlertTitle className="tracking-[0.14em] uppercase">
                Organization creation failed
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
        </DialogHeader>

        <div className="scrollbar-ui min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FieldGroup className="gap-6">
              <div className={'flex gap-3 items-center'}>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="create-org-name">Organization name</FieldLabel>
                      <Input
                        {...field}
                        id="create-org-name"
                        aria-invalid={fieldState.invalid}
                        placeholder="Zentry Inc."
                        autoComplete="organization"
                        disabled={isPending}
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
                      <FieldLabel htmlFor="create-org-logo-url">Logo URL</FieldLabel>
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        id="create-org-logo-url"
                        aria-invalid={fieldState.invalid}
                        placeholder="https://example.com/logo.png"
                        autoComplete="url"
                        type="url"
                        disabled={isPending}
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
                            <FieldLabel htmlFor={`create-org-home-url-${index}`}>
                              Home URL {index + 1}
                            </FieldLabel>
                            <div className="flex gap-3">
                              <Input
                                {...field}
                                value={field.value ?? ''}
                                id={`create-org-home-url-${index}`}
                                aria-invalid={fieldState.invalid}
                                placeholder={
                                  index === 0 ? 'http://localhost:3000' : 'https://app.example.com'
                                }
                                autoComplete="url"
                                type="url"
                                disabled={isPending}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                aria-label={`Remove home URL ${index + 1}`}
                                onClick={() => removeAppHomeUrl(index)}
                                disabled={isPending}
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
                  disabled={isPending}
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
                            <FieldLabel htmlFor={`create-org-callback-url-${index}`}>
                              Callback URL {index + 1}
                            </FieldLabel>
                            <div className="flex gap-3">
                              <Input
                                {...field}
                                value={field.value ?? ''}
                                id={`create-org-callback-url-${index}`}
                                aria-invalid={fieldState.invalid}
                                placeholder={
                                  index === 0
                                    ? 'http://localhost:3000/api/auth/callback'
                                    : 'https://app.example.com/api/auth/callback'
                                }
                                autoComplete="url"
                                type="url"
                                disabled={isPending}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon-sm"
                                aria-label={`Remove callback URL ${index + 1}`}
                                onClick={() => removeAppCallbackUrl(index)}
                                disabled={isPending}
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
                  disabled={isPending}
                >
                  <Plus className="size-4" />
                  Add callback URL
                </Button>
              </FieldGroup>
            </FieldGroup>
          </form>
        </div>

        <DialogFooter className="border-t border-foreground/10 px-6 py-6 sm:justify-between">
          <Button type="button" variant="outline" onClick={resetForm} disabled={isPending}>
            Reset
          </Button>
          <Button type="submit" form={formId} className="min-w-32" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Create organization'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAnOrganization;
