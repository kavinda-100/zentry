import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { RefreshCw } from 'lucide-react';
import GoBack from '#/components/dashboard/GoBack.tsx';
import { SectionWrapper } from '#/components/dashboard/SectionWrapper.tsx';
import { MemberActionAlert } from '#/components/dashboard/projects/member/MemberActionAlert.tsx';
import { MemberDetailsCard } from '#/components/dashboard/projects/member/MemberDetailsCard.tsx';
import { MemberPageSkeleton } from '#/components/dashboard/projects/member/MemberPageSkeleton.tsx';
import { UpdateMemberRoleCard } from '#/components/dashboard/projects/member/UpdateMemberRoleCard.tsx';
import { RevokeMemberSessionCard } from '#/components/dashboard/projects/member/RevokeMemberSessionCard.tsx';
import { BanMemberCard } from '#/components/dashboard/projects/member/BanMemberCard.tsx';
import { UnbanMemberCard } from '#/components/dashboard/projects/member/UnbanMemberCard.tsx';
import { UpdateMemberPermissionsCard } from '#/components/dashboard/projects/member/UpdateMemberPermissionsCard.tsx';
import { DeleteMemberCard } from '#/components/dashboard/projects/member/DeleteMemberCard.tsx';
import { Button } from '#/components/ui/button.tsx';
import { useGetMemberDetails } from '#/hooks/org/members/useGetMemberDetails.ts';
import { orgMemberQueryKey } from '#/hooks/org/members/queryKeys.ts';
import { useGetOrgById } from '#/hooks/org/useGetOrgById.ts';

export const Route = createFileRoute('/dashboard/projects/$projectId/member/$memberId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId, memberId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data, isPending, isError, error } = useGetMemberDetails(projectId, memberId);
  const { data: orgData } = useGetOrgById(projectId);

  const matchedMembership = useMemo(() => {
    return orgData?.data.memberships.find((membership) => membership.userId === memberId);
  }, [memberId, orgData?.data.memberships]);

  if (isPending) {
    return (
      <section className="flex w-full flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
        <GoBack />
        <MemberPageSkeleton />
      </section>
    );
  }

  if (isError || !data?.data) {
    return (
      <section className="flex w-full flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
        <GoBack />
        <SectionWrapper header="Project Docs" title="Manage Member">
          <div className="space-y-4 border border-(--line) bg-(--surface) p-6">
            <MemberActionAlert
              title="Unable to load member"
              message={error?.message ?? 'Something went wrong while loading member details.'}
            />
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              onClick={() => {
                void queryClient.invalidateQueries({ queryKey: orgMemberQueryKey(projectId, memberId) });
              }}
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </div>
        </SectionWrapper>
      </section>
    );
  }

  const member = data.data;

  return (
    <section className="flex w-full flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
      <GoBack />

      <SectionWrapper header="Project Docs" title="Manage Member">
        <MemberDetailsCard
          member={member}
          email={matchedMembership?.user.email}
          imageUrl={matchedMembership?.user.imageUrl}
        />
      </SectionWrapper>

      <SectionWrapper header="Project Docs" title="Member Actions">
        <div className="grid gap-6 xl:grid-cols-2">
          <UpdateMemberRoleCard projectId={projectId} memberId={memberId} member={member} />
          <RevokeMemberSessionCard projectId={projectId} memberId={memberId} />
          <BanMemberCard projectId={projectId} memberId={memberId} isBanned={member.isBanned} />
          <UnbanMemberCard projectId={projectId} memberId={memberId} isBanned={member.isBanned} />
          <div className="xl:col-span-2">
            <UpdateMemberPermissionsCard projectId={projectId} memberId={memberId} member={member} />
          </div>
          <div className="xl:col-span-2">
            <DeleteMemberCard projectId={projectId} memberId={memberId} />
          </div>
        </div>
      </SectionWrapper>
    </section>
  );
}
