import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Copy, ExternalLink, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

import { Button } from '#/components/ui/button.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu.tsx';
import { DataTableColumnHeader } from '#/components/table/data-table-column-header.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar.tsx';
import type { z } from 'zod';
import { orgMembershipTableRowSchema } from '#/zod/org';
import { toast } from 'sonner';

export type MembershipTableRow = z.infer<typeof orgMembershipTableRowSchema>;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(date);
};

const getInitials = (email: string) => {
  return email.slice(0, 2).toUpperCase();
};

function MembershipRowActions({ row }: { row: MembershipTableRow }) {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" className="mx-auto cursor-pointer">
          <span className="sr-only">Open member actions</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={async () => {
            await navigator.clipboard.writeText(row.userId);
            toast.success('User ID copied to clipboard');
          }}
          className={'cursor-pointer'}
        >
          <Copy className="size-4" />
          Copy user ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled
          className="cursor-pointer"
          onClick={() =>
            navigate({
              to: '/dashboard/projects/$projectId',
              params: { projectId: row.userId },
            })
          }
        >
          <ExternalLink className="size-4" />
          Manage member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<MembershipTableRow>[] = [
  {
    accessorKey: 'userImageUrl',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Image" />,
    enableSorting: false,
    cell: ({ row }) => {
      const email = row.original.email;

      return (
        <Avatar size="sm" className="border border-(--line) bg-(--surface-strong)">
          <AvatarImage src={row.original.userImageUrl ?? undefined} alt={email} />
          <AvatarFallback className="bg-primary/10 font-semibold uppercase text-primary">
            {getInitials(email)}
          </AvatarFallback>
        </Avatar>
      );
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.email}</span>,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => {
      const role = row.original.role;

      return <span className="font-medium tracking-[0.12em]">{role}</span>;
    },
  },
  {
    accessorKey: 'isBanned',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const isBanned = row.original.isBanned;

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
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    ),
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      return <MembershipRowActions row={row.original} />;
    },
  },
];
