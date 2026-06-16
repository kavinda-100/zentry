import { createServerFn } from '@tanstack/react-start';
import api from '#/lib/axios.ts';
import { registerSchema, verifyEmailSchema, loginSchema } from '@zentry/validation';

export const loginServerFn = createServerFn({ method: 'POST' })
  .validator(loginSchema)
  .handler(async ({ data }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  });

export const registerServerFn = createServerFn({ method: 'POST' })
  .validator(registerSchema)
  .handler(async ({ data }) => {
    const response = await api.post('/auth/register', data);

    return response.data;
  });

export const verifyEmailServerFn = createServerFn({ method: 'POST' })
  .validator(verifyEmailSchema)
  .handler(async ({ data }) => {
    const response = await api.post('/auth/verify-email', data);

    return response.data;
  });

export const resendVerificationEmailServerFn = createServerFn({
  method: 'POST',
}).handler(async ({ data }) => {
  const response = await api.post('/auth/resend-verification-email', data);

  return response.data;
});
