import axios from "axios";

// Helper to determine base URL, especially useful for React + Vite + .NET setups
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      window.location.pathname !== "/login"
    ) {
      // Avoid redirect loops by checking current path
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
