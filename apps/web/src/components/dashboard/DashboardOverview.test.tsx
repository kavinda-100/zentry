// @vitest-environment jsdom
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardOverview } from './DashboardOverview.tsx';

const hooks = vi.hoisted(() => ({ account: vi.fn(), projects: vi.fn() }));

vi.mock('#/hooks/auth/useGetMe.ts', () => ({ useGetMe: hooks.account }));
vi.mock('#/hooks/org/usegetUserOrgs.ts', () => ({ useGetUserOrgs: hooks.projects }));
vi.mock('#/components/dashboard/projects/CreateAnOrganization.tsx', () => ({
  default: ({ label }: { label: string }) => <button>{label}</button>,
}));
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    params,
    ...props
  }: ComponentProps<'a'> & { to: string; params?: { projectId: string } }) => (
    <a {...props} href={params ? to.replace('$projectId', params.projectId) : to} />
  ),
}));

const user = {
  firstName: 'Kavinda',
  lastName: 'Rathnayake',
  email: 'developer@example.com',
  emailVerified: true,
  imageUrl: null,
};

function project(id: string, createdAt: string) {
  return {
    id,
    name: `Project ${id}`,
    createdAt,
    logoUrl: null,
    apiKeyRow: 'secret-not-for-overview',
  };
}

function successful(data: unknown) {
  return { data: { data }, isPending: false, isError: false, error: null };
}

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <DashboardOverview />
    </QueryClientProvider>,
  );
  return { ...view, client };
}

beforeEach(() => {
  hooks.account.mockReturnValue(successful(user));
  hooks.projects.mockReturnValue(successful([]));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('DashboardOverview', () => {
  it('shows account metadata, onboarding, and exactly one creation action', () => {
    mount();
    expect(screen.getByText('Welcome back, Kavinda Rathnayake')).toBeTruthy();
    expect(screen.getByText('developer@example.com')).toBeTruthy();
    expect(screen.getByText('Email verified')).toBeTruthy();
    expect(screen.getByText('Create your first project')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Create project' })).toHaveLength(1);
    expect(screen.queryByText('Recent projects')).toBeNull();
    expect(screen.getByRole('link', { name: 'Read docs' }).getAttribute('href')).toBe('/docs');
    expect(screen.getByRole('link', { name: 'Account settings' }).getAttribute('href')).toBe(
      '/dashboard/settings',
    );
    expect(screen.getByRole('link', { name: 'View all projects' }).getAttribute('href')).toBe(
      '/dashboard/projects',
    );
  });

  it('shows only the three newest projects without changing the cached array or revealing secrets', () => {
    const projects = Object.freeze([
      project('old', '2025-01-01'),
      project('new', '2026-10-08'),
      project('middle', '2026-08-01'),
      project('recent', '2026-09-01'),
    ]);
    hooks.projects.mockReturnValue(successful(projects));
    mount();
    const links = screen.getAllByRole('link', { name: /^Open project/ });
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/dashboard/projects/new',
      '/dashboard/projects/recent',
      '/dashboard/projects/middle',
    ]);
    expect(screen.queryByText('Project old')).toBeNull();
    expect(screen.queryByText('secret-not-for-overview')).toBeNull();
    expect(screen.getByText('4')).toBeTruthy();
    expect(projects[0]?.id).toBe('old');
  });

  it('keeps projects available when account loading fails and retries only the account query', () => {
    hooks.account.mockReturnValue({
      isPending: false,
      isError: true,
      error: new Error('Account unavailable'),
    });
    hooks.projects.mockReturnValue(successful([project('new', '2026-10-08')]));
    const { client } = mount();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    expect(screen.getByRole('link', { name: 'Open project Project new' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['me'] });
  });

  it('keeps the account visible on project failure without presenting an empty workspace', () => {
    hooks.projects.mockReturnValue({
      isPending: false,
      isError: true,
      error: new Error('Projects unavailable'),
    });
    const { client } = mount();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    expect(screen.getByText('developer@example.com')).toBeTruthy();
    expect(screen.queryByText('No projects yet')).toBeNull();
    expect(screen.queryByText('Create your first project')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['user-orgs'] });
  });

  it('shows loading placeholders without flashing zero-project onboarding', () => {
    hooks.account.mockReturnValue({ isPending: true });
    hooks.projects.mockReturnValue({ isPending: true });
    mount();
    expect(screen.getByLabelText('Loading account')).toBeTruthy();
    expect(screen.getAllByLabelText('Loading project')).toHaveLength(5);
    expect(screen.queryByText('No projects yet')).toBeNull();
    expect(screen.queryByText('Create your first project')).toBeNull();
  });

  it('updates the summary and recent list when refreshed query data arrives', () => {
    const { rerender, client } = mount();
    hooks.projects.mockReturnValue(successful([project('first', 'invalid-date')]));
    hooks.account.mockReturnValue(successful({ ...user, emailVerified: false }));
    rerender(
      <QueryClientProvider client={client}>
        <DashboardOverview />
      </QueryClientProvider>,
    );
    expect(screen.queryByText('Create your first project')).toBeNull();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Open project Project first' })).toBeTruthy();
    expect(screen.getByText('Email not verified')).toBeTruthy();
    expect(screen.getAllByText('Created Unavailable')).toHaveLength(2);
  });
});
