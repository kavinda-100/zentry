import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '#/components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card.tsx';
import { useRevokeMemberSession } from '#/hooks/org/members/useRevokeMemberSession.ts';
import { orgMemberQueryKey } from '#/hooks/org/members/queryKeys.ts';
import { MemberActionAlert } from '#/components/dashboard/projects/member/MemberActionAlert.tsx';
import { getErrorMessage } from '#/components/dashboard/projects/member/utils.ts';

type RevokeMemberSessionCardProps = {
  projectId: string;
  memberId: string;
};

export function RevokeMemberSessionCard({
  projectId,
  memberId,
}: RevokeMemberSessionCardProps) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useRevokeMemberSession(projectId, memberId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRevoke = () => {
    setErrorMessage(null);

    mutate(undefined, {
      onError: (error) => {
        setErrorMessage(getErrorMessage(error, 'Failed to revoke organization sessions.'));
      },
      onSuccess: async () => {
        toast.success('Member sessions revoked.');
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: orgMemberQueryKey(projectId, memberId) }),
          queryClient.invalidateQueries({ queryKey: ['org', projectId] }),
        ]);
      },
    });
  };

  return (
    <Card className="border border-(--line) bg-(--surface) shadow-none">
      <CardHeader className="border-b border-(--line) pb-5">
        <CardTitle>Revoke Sessions</CardTitle>
        <CardDescription>
          Immediately sign this member out from all organization-scoped sessions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {errorMessage ? (
          <MemberActionAlert
            title="Session revoke failed"
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        ) : null}

        <Button type="button" variant="outline" disabled={isPending} onClick={handleRevoke}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldOff className="size-4" />}
          Revoke all sessions
        </Button>
      </CardContent>
    </Card>
  );
}
