import { LAST_AUTHENTICATED_METHOD } from '#/constants';
import { useGetMe } from '#/hooks/auth/useGetMe.ts';
import { useLocalStorage } from '#/hooks/useLocalStorage.ts';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx';
import { Input } from '#/components/ui/input.tsx';
import { Skeleton } from '#/components/ui/skeleton.tsx';
import type { LastAuthenticatedMethodType } from '#/types';

const detailLabelStyles =
  'text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)';

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const getAuthMethodLabel = (provider: string) => {
  switch (provider) {
    case 'GOOGLE':
      return 'Google';
    case 'LOCAL':
      return 'Credential';
    default:
      return provider;
  }
};

const normalizeAuthMethod = (method: LastAuthenticatedMethodType | null) => {
  switch (method) {
    case 'google':
      return 'Google';
    case 'credential':
      return 'Credential';
    default:
      return null;
  }
};

const PersonalInfoSection = () => {
  const { data, isPending, isError, error } = useGetMe();
  const { getItemFromLocalStorage } = useLocalStorage();
  const currentAuthMethod = normalizeAuthMethod(
    getItemFromLocalStorage<LastAuthenticatedMethodType>(LAST_AUTHENTICATED_METHOD),
  );

  if (isPending) {
    return (
      <Card className="border border-(--line) bg-(--surface) shadow-none ring-0">
        <CardHeader className="gap-4 border-b border-(--line) pb-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 py-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border border-dashed border-red-300 bg-red-50/60 shadow-none ring-0 dark:border-red-500/40 dark:bg-red-950/20">
        <CardContent className="py-6">
          <p className="text-sm text-red-700 dark:text-red-300">
            {error?.message ?? 'Failed to load user details.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { firstName, lastName, email, emailVerified, imageUrl, createdAt, updatedAt, accounts } =
    data.data;
  const fullName = `${firstName} ${lastName}`.trim();
  const authMethods = [...new Set(accounts.map((account) => getAuthMethodLabel(account.provider)))];

  const details = [
    { label: 'First Name', value: firstName },
    { label: 'Last Name', value: lastName },
    { label: 'Email Address', value: email },
    { label: 'Email Status', value: emailVerified ? 'Verified' : 'Not verified' },
    { label: 'Joined', value: formatDate(createdAt) },
    { label: 'Last Updated', value: formatDate(updatedAt) },
  ];

  return (
    <Card className="overflow-hidden border border-(--line) bg-(--surface) shadow-none ring-0">
      <CardHeader className="gap-4 border-b border-(--line) bg-linear-to-r from-white/80 via-transparent to-transparent pb-6 dark:from-slate-900/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar size="lg" className="size-16 border border-(--line) bg-(--surface-strong)">
              <AvatarImage src={imageUrl ?? undefined} alt={fullName || email} />
              <AvatarFallback className="text-base font-semibold uppercase">
                {getInitials(firstName, lastName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <CardTitle className="text-xl tracking-[0.08em] text-(--sea-ink) dark:text-slate-100">
                {fullName}
              </CardTitle>
              <CardDescription className="mt-1 break-all text-(--sea-ink-soft)">
                {email}
              </CardDescription>
              <div className="mt-3 flex flex-wrap gap-2">
                {authMethods.map((method) => (
                  <span
                    key={method}
                    className="inline-flex items-center gap-2 border border-(--line) bg-background/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-(--sea-ink-soft) dark:bg-slate-900/40"
                  >
                    {method}
                    {currentAuthMethod === method ? (
                      <span className="bg-primary px-2 py-0.5 text-[0.58rem] tracking-[0.18em] text-primary-foreground dark:text-black">
                        Current
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <span className="inline-flex w-fit items-center border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            {emailVerified ? 'Verified account' : 'Verification pending'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 py-6 md:grid-cols-2">
        {details.map((detail) => (
          <label key={detail.label} className="block space-y-2">
            <p className={detailLabelStyles}>{detail.label}</p>
            <Input
              value={detail.value}
              readOnly
              className="h-11 border-x-0 border-t-0 border-b-(--line) bg-transparent px-0 text-sm text-(--sea-ink) opacity-100 focus-visible:border-b-(--sea-ink-soft) dark:text-slate-100"
            />
          </label>
        ))}
      </CardContent>
    </Card>
  );
};

export default PersonalInfoSection;
