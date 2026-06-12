import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email({ error: 'Invalid email' }),
  firstName: z.string({ error: 'First name is required' }).min(3, {
    error: 'First name must be at least 3 characters',
  }),
  lastName: z
    .string({ error: 'Last name is required' })
    .min(3, { error: 'Last name must be at least 3 characters' }),
  imageUrl: z.url({ error: 'Invalid URL' }).optional(),
  password: z
    .string({ error: 'Password is required' })
    .min(6, { error: 'Password must be at least 6 characters' })
    .max(12, { error: 'Password must be at most 12 characters' }),
});

export const loginSchema = z.object({
  email: z.email({ error: 'Invalid email' }),
  password: z.string({ error: 'Password is required' }),
});

export type RegisterSchemaType = z.infer<typeof registerSchema>;
export type LoginSchemaType = z.infer<typeof loginSchema>;
