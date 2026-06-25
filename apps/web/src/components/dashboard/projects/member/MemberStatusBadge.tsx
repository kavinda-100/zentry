import { ShieldAlert, ShieldCheck } from 'lucide-react';

type MemberStatusBadgeProps = {
  isBanned: boolean;
};

export function MemberStatusBadge({ isBanned }: MemberStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] ${
        isBanned ? 'text-destructive' : 'text-emerald-700'
      }`}
    >
      {isBanned ? <ShieldAlert className="size-3.5" /> : <ShieldCheck className="size-3.5" />}
      {isBanned ? 'Banned' : 'Active'}
    </span>
  );
}
