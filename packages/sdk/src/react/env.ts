import { z } from 'zod';
import dotenv from 'dotenv';
import findConfig from 'find-config';

dotenv.config();

// Automatically traverse upward until the root .env file is found
const envPath = findConfig('.env');

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  throw new Error('No .env file found in the project root. Please create one at the root.');
}

export const EnvSchema = z.object({
  ZENTRY_ORG_ID: z.string({ error: 'ZENTRY_ORG_ID is required' }),
  ZENTRY_API_KEY: z.string({ error: 'ZENTRY_API_KEY_RAW is required' }),
  ZENTRY_APP_HOME_URL: z.string({ error: 'ZENTRY_APP_HOME_URL is required' }),
  ZENTRY_APP_CALLBACK_URL: z.string({ error: 'ZENTRY_APP_CALLBACK_URL is required' }),
});

const validatedEnv = EnvSchema.safeParse(process.env);

if (!validatedEnv.success) {
  throw new Error(
    `Invalid environment variables: ${validatedEnv.error.issues.map((issue) => issue.message).join(', ')}`,
  );
}

export const env = validatedEnv.data;
