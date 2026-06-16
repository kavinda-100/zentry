import axios from 'axios';

const BASE_URL = import.meta.env.API_URL as string;

if (!BASE_URL) throw new Error('API_URL is not defined');

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
