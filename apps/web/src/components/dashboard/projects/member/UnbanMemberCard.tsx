import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '#/components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card.tsx';
import { useUnbanMember } from '#/hooks/org/members/useUnbanMember.ts';
import { orgMemberQueryKey } from '#/hooks/org/members/queryKeys.ts';
import { MemberActionAlert } from '#/components/dashboard/projects/member/MemberActionAlert.tsx';
import { getErrorMessage } from '#/components/dashboard/projects/member/utils.ts';

type UnbanMemberCardProps = {
  projectId: string;
  memberId: string;
  isBanned: boolean;
};

export function UnbanMemberCard({ projectId, memberId, isBanned }: UnbanMemberCardProps) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useUnbanMember(projectId, memberId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUnban = () => {
    setErrorMessage(null);

    mutate(undefined, {
      onError: (error) => {
        setErrorMessage(getErrorMessage(error, 'Failed to unban this member.'));
      },
      onSuccess: async () => {
        toast.success('Member unbanned successfully.');
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
        <CardTitle>Unban Member</CardTitle>
        <CardDescription>
          Restore organization access for a previously banned member.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {errorMessage ? (
          <MemberActionAlert
            title="Unban failed"
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        ) : null}
        <Button type="button" variant="outline" disabled={isPending || !isBanned} onClick={handleUnban}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          {!isBanned ? 'Member already active' : 'Unban member'}
        </Button>
      </CardContent>
    </Card>
  );
}
