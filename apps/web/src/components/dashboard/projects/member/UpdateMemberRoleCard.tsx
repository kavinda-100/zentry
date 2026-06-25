import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '#/components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '#/components/ui/card.tsx';
import { useUpdateMemberRole } from '#/hooks/org/members/useUpdateMemberRole.ts';
import { orgMemberQueryKey } from '#/hooks/org/members/queryKeys.ts';
import { memberDetailsResponseSchema } from '#/zod/org';
import { MemberActionAlert } from '#/components/dashboard/projects/member/MemberActionAlert.tsx';
import { getErrorMessage } from '#/components/dashboard/projects/member/utils.ts';

type MemberDetails = z.infer<typeof memberDetailsResponseSchema>;

type UpdateMemberRoleCardProps = {
  projectId: string;
  memberId: string;
  member: MemberDetails;
};

export function UpdateMemberRoleCard({
  projectId,
  memberId,
  member,
}: UpdateMemberRoleCardProps) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useUpdateMemberRole(projectId, memberId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRoleUpdate = (role: MemberDetails['role']) => {
    setErrorMessage(null);

    mutate(
      { role },
      {
        onError: (error) => {
          setErrorMessage(getErrorMessage(error, 'Failed to update the member role.'));
        },
        onSuccess: async () => {
          toast.success('Member role updated successfully.');
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: orgMemberQueryKey(projectId, memberId) }),
            queryClient.invalidateQueries({ queryKey: ['org', projectId] }),
          ]);
        },
      },
    );
  };

  return (
    <Card className="border border-(--line) bg-(--surface) shadow-none">
      <CardHeader className="border-b border-(--line) pb-5">
        <CardTitle>Update Role</CardTitle>
        <CardDescription>
          Switch this member between administrator and standard member access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {errorMessage ? (
          <MemberActionAlert
            title="Role update failed"
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <Button
            type="button"
            variant={member.role === 'ADMIN' ? 'default' : 'outline'}
            className="justify-start"
            disabled={isPending || member.role === 'ADMIN'}
            onClick={() => handleRoleUpdate('ADMIN')}
          >
            {isPending && member.role !== 'ADMIN' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            Set as admin
          </Button>
          <Button
            type="button"
            variant={member.role === 'MEMBER' ? 'default' : 'outline'}
            className="justify-start"
            disabled={isPending || member.role === 'MEMBER'}
            onClick={() => handleRoleUpdate('MEMBER')}
          >
            {isPending && member.role !== 'MEMBER' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserRound className="size-4" />
            )}
            Set as member
          </Button>
        </div>
      </CardContent>
      <CardFooter className="border-t border-(--line) pt-5 text-sm text-muted-foreground">
        Current role: <span className="ml-2 font-medium text-foreground">{member.role}</span>
      </CardFooter>
    </Card>
  );
}
