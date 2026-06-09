import dotenv from 'dotenv';
import {ApiEnvSchema} from '@zentry/validation';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(__dirname, '../../../../.env');

dotenv.config({ path: rootEnvPath});

const validatedEnv = ApiEnvSchema.safeParse(process.env);

if (!validatedEnv.success) {
    throw new Error(`Invalid environment variables on API: ${validatedEnv.error.issues.map((i) => i.message).join(', ')}`);
}

export const env = validatedEnv.data;