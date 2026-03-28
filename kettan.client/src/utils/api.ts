import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Create a configured axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '', // Will proxy to local .NET during dev
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject the Authorization token on every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle global API errors (e.g., Token expiration)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the backend returns 401 Unauthorized, automatically log the user out
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login'; // Alternatively, route using history
    }
    return Promise.reject(error);
  }
);
