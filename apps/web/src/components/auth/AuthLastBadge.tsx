import { cn } from '#/lib/utils.ts';

type AuthLastBadgeProps = {
  className?: string;
  label?: string;
};

const AuthLastBadge = ({ className, label = 'last' }: AuthLastBadgeProps) => {
  return (
    <span
      className={cn(
        'absolute -right-1 -top-2 z-10 inline-flex items-center rounded-full border border-primary bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] shadow-sm dark:text-black',
        className,
      )}
    >
      {label}
    </span>
  );
};

export default AuthLastBadge;
