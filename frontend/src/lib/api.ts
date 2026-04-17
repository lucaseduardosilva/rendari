import axios from 'axios';
import { useAuth } from '../stores/auth';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = useAuth.getState().refreshToken;
      if (!refreshToken) { useAuth.getState().logout(); return Promise.reject(error); }
      try {
        if (refreshing) await new Promise(r => setTimeout(r, 200));
        else {
          refreshing = true;
          const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
          useAuth.getState().setAccessToken(data.accessToken);
          refreshing = false;
        }
        original.headers.Authorization = `Bearer ${useAuth.getState().accessToken}`;
        return api(original);
      } catch {
        refreshing = false;
        useAuth.getState().logout();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
