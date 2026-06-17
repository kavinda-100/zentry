import axios from 'axios';
import { env } from '#/lib/env.ts';
import { SESSION_TOKEN_KEY } from '#/constants';

const api = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);

    if (storedToken) {
      const token = JSON.parse(storedToken) as string;
      config.headers = axios.AxiosHeaders.from(config.headers);
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return config;
});

export default api;
