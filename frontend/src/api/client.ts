import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cineverse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('API returned 401 Unauthorized');
      // If token expired, clear it so next refresh picks up valid token
      const token = localStorage.getItem('cineverse_token');
      if (token && !token.startsWith('demo-token-')) {
        localStorage.removeItem('cineverse_token');
      }
    }
    return Promise.reject(error);
  }
);

export default client;
