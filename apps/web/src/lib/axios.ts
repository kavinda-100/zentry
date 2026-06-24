import axios, { type AxiosInstance } from 'axios';
import { env } from '#/lib/env.ts';
import { SESSION_TOKEN_KEY } from '#/constants';

/**
 * @description The main axios instance for making API requests.
 * This instance is configured to use the base URL from the environment variables.
 * And use the stored token in the local storage for authentication.
 * NOTE: This instance is for regular API requests, not organization-specific requests.
 * @type {AxiosInstance}
 * @constant api
 * */
const api: AxiosInstance = axios.create({
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

/**
 * @description The axios instance for making organization-specific API requests.
 * This instance is configured to use the base URL from the environment variables.
 * And use the stored token in the local storage for authentication.
 * NOTE: This instance is for organization-specific API requests, not regular API requests.
 * @type {AxiosInstance}
 * @constant apiWithOrg
 * */
export const apiWithOrg: AxiosInstance = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiWithOrg.interceptors.request.use((config) => {
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
