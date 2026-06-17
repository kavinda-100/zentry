import { createServerFn } from '@tanstack/react-start';
import api from '#/lib/axios.ts';
import { registerSchema } from '@zentry/validation';

export const registerServerFn = createServerFn({ method: 'POST' })
  .validator(registerSchema)
  .handler(async ({ data }) => {
    const response = await api.post('/auth/register', data);

    return response.data;
  });
