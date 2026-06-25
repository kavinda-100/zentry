import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CircleAlert, Loader2, TriangleAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '#/components/ui/button.tsx';
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
import { Field, FieldDescription, FieldLabel } from '#/components/ui/field.tsx';
import { Input } from '#/components/ui/input.tsx';
import { useDeleteMember } from '#/hooks/org/members/useDeleteMember.ts';
import { DELETE_MEMBER_CONFIRMATION_TEXT, getErrorMessage } from '#/components/dashboard/projects/member/utils.ts';

type DeleteMemberCardProps = {
  projectId: string;
  memberId: string;
};

export function DeleteMemberCard({ projectId, memberId }: DeleteMemberCardProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mutate, isPending } = useDeleteMember(projectId, memberId);
  const [open, setOpen] = useState(false);
  const [confirmationValue, setConfirmationValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDeleteEnabled = confirmationValue.trim() === DELETE_MEMBER_CONFIRMATION_TEXT && !isPending;

  const handleDelete = () => {
    setErrorMessage(null);

    mutate(undefined, {
      onError: (error) => {
        setErrorMessage(getErrorMessage(error, 'Failed to delete this member.'));
      },
      onSuccess: async () => {
        toast.success('Member deleted successfully.');
        setOpen(false);
        setConfirmationValue('');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['org', projectId] }),
          queryClient.removeQueries({ queryKey: ['org-member', projectId, memberId] }),
        ]);
        await navigate({
          to: '/dashboard/projects/$projectId',
          params: { projectId },
          replace: true,
        });
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
        <CardTrigger />
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 border border-foreground/10 bg-background/95 p-0 shadow-xl sm:max-w-2xl">
        <DialogHeader className="gap-3 border-b border-foreground/10 px-6 py-6">
          <DialogTitle className="text-3xl tracking-[0.18em]">Delete member</DialogTitle>
          <DialogDescription className="max-w-2xl text-sm">
            This removes the membership and may delete the user entirely if they do not belong to any other organization.
          </DialogDescription>

          <Alert className="mt-2 border-destructive/30 bg-destructive/8 shadow-sm backdrop-blur-sm">
            <TriangleAlert className="mt-0.5 size-4 text-destructive" />
            <AlertTitle className="tracking-[0.14em] uppercase text-destructive">
              Permanent deletion warning
            </AlertTitle>
            <AlertDescription className="leading-6 text-destructive/80">
              Root admins cannot be removed here, and this action may permanently delete the user record when no memberships remain.
            </AlertDescription>
          </Alert>

          {errorMessage ? (
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
          ) : null}
        </DialogHeader>

        <div className="px-6 py-6">
          <Field>
            <FieldLabel htmlFor="delete-member-confirmation">Type to confirm</FieldLabel>
            <Input
              id="delete-member-confirmation"
              value={confirmationValue}
              onChange={(event) => setConfirmationValue(event.target.value)}
              placeholder={DELETE_MEMBER_CONFIRMATION_TEXT}
              autoComplete="off"
              spellCheck={false}
              disabled={isPending}
            />
            <FieldDescription>
              Type <span className="font-mono text-foreground">{DELETE_MEMBER_CONFIRMATION_TEXT}</span> to enable deletion.
            </FieldDescription>
          </Field>
        </div>

        <DialogFooter className="border-t border-foreground/10 px-6 py-6 sm:justify-between">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={!isDeleteEnabled}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Delete member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CardTrigger() {
  return (
    <button
      type="button"
      className="w-full cursor-pointer border border-destructive/30 bg-destructive/6 p-6 text-left transition-colors hover:bg-destructive/10"
    >
      <p className="text-lg font-semibold uppercase tracking-[0.14em] text-destructive">Delete Member</p>
      <p className="mt-2 text-sm leading-6 text-destructive/80">
        Remove this member from the organization. This action cannot be undone.
      </p>
    </button>
  );
}
