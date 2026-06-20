import { z } from 'zod';

const WebEnvSchema = z.object({
  VITE_API_URL: z
    .url({
      error: 'VITE_API_URL must be a valid URL string (e.g. http://localhost:5000/api/v1).',
    })
    .default('http://localhost:5000/api/v1'),
  VITE_UI_URL: z
    .url({
      error: 'VITE_UI_URL must be a valid URL string (e.g. http://localhost:3000).',
    })
    .default('http://localhost:3000'),
});

const validatedEnv = WebEnvSchema.safeParse(import.meta.env);

if (!validatedEnv.success) {
  throw new Error(
    `Invalid environment variables on web: ${validatedEnv.error.issues.map((issue) => issue.message).join(', ')}`,
  );
}

export const env = validatedEnv.data;
