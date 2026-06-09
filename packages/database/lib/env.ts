import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseEnvSchema } from '@zentry/validation';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(__dirname, '../../../.env');
// const packageEnvPath = resolve(__dirname, '../.env');

dotenv.config({ path: rootEnvPath });
// dotenv.config({ path: packageEnvPath, override: true });

const validatedEnv = DatabaseEnvSchema.safeParse(process.env);

if (!validatedEnv.success)
  throw new Error(
    `Invalid environment variables on Database: ${validatedEnv.error.issues.map((i) => i.message).join(', ')}`,
  );

export const env = validatedEnv.data;
