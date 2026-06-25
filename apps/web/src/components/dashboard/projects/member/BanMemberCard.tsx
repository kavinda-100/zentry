import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Ban, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '#/components/ui/button.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card.tsx';
import { useBanMember } from '#/hooks/org/members/useBanMember.ts';
import { orgMemberQueryKey } from '#/hooks/org/members/queryKeys.ts';
import { MemberActionAlert } from '#/components/dashboard/projects/member/MemberActionAlert.tsx';
import { getErrorMessage } from '#/components/dashboard/projects/member/utils.ts';

type BanMemberCardProps = {
  projectId: string;
  memberId: string;
  isBanned: boolean;
};

export function BanMemberCard({ projectId, memberId, isBanned }: BanMemberCardProps) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useBanMember(projectId, memberId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleBan = () => {
    setErrorMessage(null);

    mutate(undefined, {
      onError: (error) => {
        setErrorMessage(getErrorMessage(error, 'Failed to ban this member.'));
      },
      onSuccess: async () => {
        toast.success('Member banned successfully.');
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
        <CardTitle>Ban Member</CardTitle>
        <CardDescription>
          Prevent this member from using organization access until an admin unbans them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {errorMessage ? (
          <MemberActionAlert
            title="Ban failed"
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        ) : null}
        <Button type="button" variant="destructive" disabled={isPending || isBanned} onClick={handleBan}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
          {isBanned ? 'Member already banned' : 'Ban member'}
        </Button>
      </CardContent>
    </Card>
  );
}
