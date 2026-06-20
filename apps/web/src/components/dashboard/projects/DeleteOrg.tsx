import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteOrg } from '#/hooks/org/useDeleteOrg.ts';
import { useNavigate } from '@tanstack/react-router';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog.tsx';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '#/components/ui/alert.tsx';
import { Button } from '#/components/ui/button.tsx';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '#/components/ui/field.tsx';
import { Input } from '#/components/ui/input.tsx';
import { CircleAlert, Loader2, TriangleAlert, X } from 'lucide-react';

type DeleteOrgProps = {
  orgId: string;
};

const DELETE_CONFIRMATION_TEXT = 'delete-organization';

const DeleteOrg = ({ orgId }: DeleteOrgProps) => {
  const { mutate, isPending } = useDeleteOrg(orgId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmationValue, setConfirmationValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDeleteEnabled = confirmationValue.trim() === DELETE_CONFIRMATION_TEXT && !isPending;

  const handleDelete = () => {
    setErrorMessage(null);

    mutate(undefined, {
      onSuccess: async () => {
        setConfirmationValue('');
        setOpen(false);
        await queryClient.invalidateQueries({ queryKey: ['user-orgs'] });
        await navigate({ to: '/dashboard/projects', replace: true });
      },
      onError: (error) => {
        setErrorMessage(error.message ?? 'Something went wrong while deleting the organization.');
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setConfirmationValue('');
          setErrorMessage(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive" disabled={isPending}>
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 border border-foreground/10 bg-background/95 p-0 shadow-xl sm:max-w-2xl">
        <DialogHeader className="gap-3 border-b border-foreground/10 px-6 py-6">
          <DialogTitle className="text-3xl tracking-[0.18em]">Delete organization</DialogTitle>
          <DialogDescription className="max-w-2xl text-sm">
            This action cannot be undone. All data that belongs to this organization will be
            permanently deleted.
          </DialogDescription>

          <Alert className="mt-2 border-destructive/30 bg-destructive/8 shadow-sm backdrop-blur-sm">
            <TriangleAlert className="mt-0.5 size-4 text-destructive" />
            <AlertTitle className="tracking-[0.14em] uppercase text-destructive">
              Permanent deletion warning
            </AlertTitle>
            <AlertDescription className="leading-6 text-destructive/80">
              Deleting this organization removes its project details, URLs, memberships, and any
              related records tied to it.
            </AlertDescription>
          </Alert>

          {errorMessage && (
            <Alert
              variant="destructive"
              className="mt-2 border-destructive/30 bg-destructive/8 shadow-sm backdrop-blur-sm"
            >
              <CircleAlert className="mt-0.5 size-4" />
              <AlertTitle className="tracking-[0.14em] uppercase">Delete failed</AlertTitle>
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
                  onClick={() => setErrorMessage(null)}
                >
                  <X className="size-3.5" />
                </Button>
              </AlertAction>
            </Alert>
          )}
        </DialogHeader>

        <div className="px-6 py-6">
          <FieldGroup className="gap-6">
            <Field>
              <FieldLabel htmlFor="delete-org-confirmation">Type to confirm</FieldLabel>
              <Input
                id="delete-org-confirmation"
                value={confirmationValue}
                onChange={(event) => setConfirmationValue(event.target.value)}
                placeholder={DELETE_CONFIRMATION_TEXT}
                autoComplete="off"
                spellCheck={false}
                disabled={isPending}
              />
              <FieldDescription>
                Type <span className="font-mono text-foreground">{DELETE_CONFIRMATION_TEXT}</span>{' '}
                to enable deletion.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </div>

        <DialogFooter className="border-t border-foreground/10 px-6 py-6 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={!isDeleteEnabled}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Delete organization'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteOrg;
