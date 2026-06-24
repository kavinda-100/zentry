import { z } from 'zod';

export const ClientEnvSchema = z.object({
  ZENTRY_ORG_ID: z.string().min(1, 'ZENTRY_ORG_ID is required'),
  ZENTRY_APP_CALLBACK_URL: z.string().min(1, 'ZENTRY_APP_CALLBACK_URL is required'),
  ZENTRY_API_BASE_URL: z.string().min(1).optional(),
  ZENTRY_UI_BASE_URL: z.string().min(1).optional(),
});

export const ServerEnvSchema = ClientEnvSchema.extend({
  ZENTRY_APP_HOME_URL: z.string().min(1, 'ZENTRY_APP_HOME_URL is required').optional(),
});

export type ClientEnv = z.infer<typeof ClientEnvSchema>;
export type ServerEnv = z.infer<typeof ServerEnvSchema>;

function formatIssues(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(', ');
}

export function parseClientEnv(source: Record<string, unknown>): ClientEnv {
  const validatedEnv = ClientEnvSchema.safeParse(source);

  if (!validatedEnv.success) {
    throw new Error(`Invalid Zentry client environment: ${formatIssues(validatedEnv.error)}`);
  }

  return validatedEnv.data;
}

export function parseServerEnv(source: Record<string, unknown>): ServerEnv {
  const validatedEnv = ServerEnvSchema.safeParse(source);

  if (!validatedEnv.success) {
    throw new Error(`Invalid Zentry server environment: ${formatIssues(validatedEnv.error)}`);
  }

  return validatedEnv.data;
}
