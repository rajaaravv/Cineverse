import client from './client';
import { ApiResponse, User } from '../types';

export const userApi = {
  getProfile: async (): Promise<User> => {
    const res = await client.get<ApiResponse<User>>('/user/profile');
    return res.data.data;
  },

  updateProfile: async (data: { username?: string; currentPassword?: string; newPassword?: string }): Promise<User> => {
    const res = await client.put<ApiResponse<User>>('/user/profile', data);
    return res.data.data;
  },
};
