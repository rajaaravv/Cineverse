import client from './client';
import { ApiResponse, AuthResponse } from '../types';

export const authApi = {
  register: async (data: { username: string; email: string; password: string }): Promise<AuthResponse> => {
    const res = await client.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return res.data.data;
  },

  login: async (data: { usernameOrEmail: string; password: string }): Promise<AuthResponse> => {
    const res = await client.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await client.post('/auth/logout');
    } finally {
      localStorage.removeItem('cineverse_token');
      localStorage.removeItem('cineverse_user');
    }
  },
};
