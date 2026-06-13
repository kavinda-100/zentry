import type { $ZodIssue } from 'zod/v4/core';

/**
 * @description Utility function for formating Zod errors
 * @returns A string of formatted Zod errors
 * @param issues - The Zod issues array
 * */
export const formatZodIssues = (issues: $ZodIssue[]) => {
  return issues.map((issue) => issue.message).join(', ');
};
