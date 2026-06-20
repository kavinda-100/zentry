import * as React from 'react';
import { cn } from '#/lib/utils.ts';

type SectionProps = {
  className?: string;
  header: string;
  title: string;
  children: React.ReactNode;
};
export function SectionWrapper({ title, header, children, className }: SectionProps) {
  return (
    <section className={cn('flex w-full flex-col gap-4', className)}>
      <div className="space-y-2">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-(--kicker)">
          {header}
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-[0.08em] text-slate-950 dark:text-slate-100">
          {title}
        </h1>
      </div>
      {children}
    </section>
  );
}
