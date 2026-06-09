import { z } from 'zod';

export const ApiEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(5000),
    DATABASE_URL: z.url(),
    REDIS_URL: z.url(),
    KAFKA_BROKERS: z.string().transform((str) => str.split(',')),
    COOKIE_SECRET: z.string().min(32),
});

export const WorkerEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.url(),
    KAFKA_BROKERS: z.string().transform((str) => str.split(',')),
    SMTP_HOST: z.string(),
    SMTP_PORT: z.coerce.number(),
    SMTP_USER: z.string(),
    SMTP_PASS: z.string(),
});

export const DatabaseEnvSchema = z.object({
    DATABASE_URL: z.url(),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;
export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;
export type DatabaseEnv = z.infer<typeof DatabaseEnvSchema>;