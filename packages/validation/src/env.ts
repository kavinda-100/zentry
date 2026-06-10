import { z } from 'zod';

export const ApiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce
    .number({
      error: 'PORT environment variable must be a valid number.',
    })
    .default(5000),
  DATABASE_URL: z.url({
    error: 'DATABASE_URL must be a valid URL string (e.g., postgresql://...).',
  }),
  REDIS_URL: z.url({ error: 'REDIS_URL must be a valid URL string (e.g., redis://...).' }),
  KAFKA_BROKERS: z
    .string({
      error: 'KAFKA_BROKERS environment variable is missing.',
    })
    .min(1, { error: 'KAFKA_BROKERS cannot be an empty string.' })
    .transform((str) => str.split(',')),
  COOKIE_SECRET: z
    .string({
      error: 'COOKIE_SECRET is missing from the environment environment variables.',
    })
    .min(32, {
      error: 'COOKIE_SECRET is too vulnerable. It must be at least 32 characters long.',
    }),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('debug'),
});

export const WorkerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.url({ error: 'DATABASE_URL must be a valid connection URL.' }),
  KAFKA_BROKERS: z
    .string({
      error: 'KAFKA_BROKERS is required to connect worker event consumers.',
    })
    .transform((str) => str.split(',')),
  SMTP_HOST: z
    .string({
      error: 'SMTP_HOST is required to dispatch transactional emails.',
    })
    .min(1, { message: 'SMTP_HOST cannot be an empty string.' }),
  SMTP_PORT: z.coerce.number({
    error: 'SMTP_PORT must be a valid numerical port address (e.g., 587).',
  }),
  SMTP_USER: z.string({
    error: 'SMTP_USER credential configuration string is missing.',
  }),
  SMTP_PASS: z.string({
    error: 'SMTP_PASS authentication credential string is missing.',
  }),
});

export const DatabaseEnvSchema = z.object({
  DATABASE_URL: z.url({ error: 'DATABASE_URL must be a valid database protocol URL string.' }),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;
export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;
export type DatabaseEnv = z.infer<typeof DatabaseEnvSchema>;
