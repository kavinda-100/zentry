import { createFileRoute } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx';
import { cn } from '#/lib/utils.ts';
import type { ComponentProps } from 'react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import zentryGuide from '../../../public/docs/zentry-guide.md?raw';

export const Route = createFileRoute('/docs/')({
  component: RouteComponent,
});

const enhancedComponents: Components = {
  h1: ({ children, ...props }) => (
    <header className="docs-hero-block">
      <p className="docs-section-label">SDK Overview</p>
      <h1 className="docs-hero-title" {...props}>
        {children}
      </h1>
      <p className="docs-hero-copy">
        Zentry integration guidance for frontend applications, backend APIs, and the shared session
        model between them.
      </p>
    </header>
  ),
  h2: ({ children, ...props }) => (
    <section className="docs-section-heading">
      <p className="docs-section-label">Documentation Section</p>
      <h2 {...props}>{children}</h2>
    </section>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="docs-subheading" {...props}>
      {children}
    </h3>
  ),
  p: ({ className, ...props }) => <p className={cn('docs-copy', className)} {...props} />,
  ul: ({ className, ...props }) => <ul className={cn('docs-list', className)} {...props} />,
  ol: ({ className, ...props }) => (
    <ol className={cn('docs-list docs-list-ordered', className)} {...props} />
  ),
  li: ({ className, ...props }) => <li className={cn('docs-list-item', className)} {...props} />,
  blockquote: ({ className, ...props }) => (
    <blockquote className={cn('docs-callout', className)} {...props} />
  ),
  pre: ({ children, ...props }) => {
    const language = getCodeLanguage(children);

    return (
      <div className="docs-code-frame">
        <div className="docs-code-frame__header">
          <span className="docs-code-frame__traffic" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="docs-code-frame__label">{language}</span>
        </div>
        <pre className="docs-code-frame__body" {...props}>
          {children}
        </pre>
      </div>
    );
  },
  code: ({ className, children, ...props }) => {
    const inline = !className;

    if (inline) {
      return (
        <code className="docs-inline-code" {...props}>
          {children}
        </code>
      );
    }

    return (
      <code className={cn('docs-code-text', className)} {...props}>
        {children}
      </code>
    );
  },
};

function RouteComponent() {
  return (
    <section className="min-h-screen bg-background px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <Card className="island-shell overflow-hidden border border-(--line) bg-(--surface) py-0 shadow-none ring-0">
          <CardHeader className="gap-4 border-b border-(--line) bg-[linear-gradient(135deg,color-mix(in_oklab,var(--surface-strong)_88%,white_12%),var(--surface))] py-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="island-kicker">Developer Documentation</span>
              <span className="border border-(--line) bg-background/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-(--sea-ink-soft)">
                Frontend + Backend Integration
              </span>
            </div>
            <div className="max-w-3xl space-y-3">
              <CardTitle className="display-title text-3xl tracking-normal normal-case text-foreground sm:text-4xl">
                Integrate your app with Zentry
              </CardTitle>
              <CardDescription className="text-base leading-7 text-(--sea-ink-soft)">
                Everything developers need to wire authentication, session forwarding, and backend
                validation with the Zentry SDK.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card className="island-shell overflow-hidden border border-(--line) bg-(--surface) py-0 shadow-none ring-0">
          <CardContent className="px-0">
            <article className="docs-html max-w-none px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
              <ReactMarkdown components={enhancedComponents} rehypePlugins={[rehypeHighlight]}>
                {zentryGuide}
              </ReactMarkdown>
            </article>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function getCodeLanguage(children: ComponentProps<'pre'>['children']) {
  const node = React.Children.toArray(children)[0];

  if (
    React.isValidElement<{ className?: string }>(node) &&
    typeof node.props.className === 'string'
  ) {
    const match = node.props.className.match(/language-([\w-]+)/);

    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }

  return 'CODE';
}
