export const orgMemberQueryKey = (projectId: string, memberId: string) => [
  'org-member',
  projectId,
  memberId,
] as const;
