import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically add JWT to every request if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network Error (e.g. ERR_CONNECTION_REFUSED)
      console.error("Network Error: Backend is unreachable.");
      return Promise.reject({
        ...error,
        message: "Network Error: Cannot connect to the server. Please ensure the backend is running.",
        response: { data: { detail: "System is currently offline. Please try again later." } }
      });
    }
    return Promise.reject(error);
  }
);

export default api;
