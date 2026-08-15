import axios from 'axios';

export const API_ROOT = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
export const ASSET_ROOT = API_ROOT.replace(/\/api\/?$/, '');
export const api = axios.create({ baseURL: API_ROOT, timeout: 120_000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('careerpilot_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('careerpilot_token');
      if (!location.pathname.includes('login')) location.href = '/login';
    }
    return Promise.reject(error);
  }
);
export const errorMessage = (error: unknown) =>
  axios.isAxiosError(error)
    ? (error.response?.data?.message ?? error.message)
    : 'Something went wrong';
