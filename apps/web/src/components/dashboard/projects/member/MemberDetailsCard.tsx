import type { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar.tsx';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '#/components/ui/card.tsx';
import { memberDetailsResponseSchema } from '#/zod/org';
import { MemberStatusBadge } from '#/components/dashboard/projects/member/MemberStatusBadge.tsx';
import {
  formatDateTime,
  getInitials,
  stringifyPermissions,
} from '#/components/dashboard/projects/member/utils.ts';

type MemberDetails = z.infer<typeof memberDetailsResponseSchema>;

type MemberDetailsCardProps = {
  member: MemberDetails;
  email?: string | null;
  imageUrl?: string | null;
};

export function MemberDetailsCard({ member, email, imageUrl }: MemberDetailsCardProps) {
  const permissionPreview =
    member.permissions === null
      ? 'No member-specific permissions set.'
      : stringifyPermissions(member.permissions);

  return (
    <Card className="border border-(--line) bg-(--surface) shadow-none">
      <CardHeader className="gap-3 border-b border-(--line) pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)">
              Member Details
            </p>
            <CardTitle className="text-2xl tracking-[0.12em] normal-case">
              {email ?? 'Organization member'}
            </CardTitle>
            <CardDescription className="max-w-2xl">
              Review the member state before applying role, access, or destructive changes.
            </CardDescription>
          </div>
          <MemberStatusBadge isBanned={member.isBanned} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 md:grid-cols-[auto,1fr]">
        <Avatar size="lg" className="border border-(--line) bg-(--surface-strong)">
          <AvatarImage src={imageUrl ?? undefined} alt={email ?? 'Member avatar'} />
          <AvatarFallback className="bg-primary/10 font-semibold uppercase text-primary">
            {getInitials(email)}
          </AvatarFallback>
        </Avatar>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-(--line) p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--kicker)">
              Role
            </p>
            <p className="mt-2 font-medium">{member.role}</p>
          </div>
          <div className="border border-(--line) p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--kicker)">
              User ID
            </p>
            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
              {member.userId}
            </p>
          </div>
          <div className="border border-(--line) p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--kicker)">
              Joined
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(member.createdAt)}</p>
          </div>
          <div className="border border-(--line) p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--kicker)">
              Updated
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(member.updatedAt)}</p>
          </div>
        </div>

        <div className="md:col-span-2 border border-(--line) p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--kicker)">
            Permissions
          </p>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words bg-background/70 p-4 text-xs leading-6 text-muted-foreground">
            {permissionPreview}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
