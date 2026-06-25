import * as React from 'react';
import { cn } from '#/lib/utils.ts';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-28 w-full resize-y border border-(--line) bg-transparent px-3 py-2 text-sm outline-none transition-[color,border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
