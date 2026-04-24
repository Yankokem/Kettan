import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Create a configured axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '', // Will proxy to local .NET during dev
  withCredentials: true,
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
    // Skip this for the login endpoint itself so the user can see the "Invalid credentials" error
    if (error.response?.status === 401 && 
        !error.config.url?.endsWith('/api/auth/login') &&
        !window.location.pathname.startsWith('/market/register')) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }

    
    // If the backend returns 402 Payment Required (Subscription disabled/pending)
    // Redirect to company profile or billing page
    if (error.response?.status === 402 && window.location.pathname !== '/company-profile') {
      window.location.href = '/company-profile';
    }

    return Promise.reject(error);
  }
);
