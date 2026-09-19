import client from './client';
import { ApiResponse, User } from '../types';

export const userApi = {
  getProfile: async (): Promise<User> => {
    try {
      const res = await client.get<ApiResponse<User>>('/user/profile');
      if (res.data?.data) {
        localStorage.setItem('cineverse_user', JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch (err) {
      console.warn('Backend profile fetch failed, using local user');
    }

    const saved = localStorage.getItem('cineverse_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }

    const defaultUser: User = {
      id: 1,
      username: 'Austin',
      email: 'austin@cineverse.tv',
      role: 'ROLE_USER',
      createdAt: new Date().toISOString(),
      playlistCount: 0,
      favoriteCount: 0,
    };
    return defaultUser;
  },

  updateProfile: async (data: { username?: string; currentPassword?: string; newPassword?: string }): Promise<User> => {
    try {
      const res = await client.put<ApiResponse<User>>('/user/profile', data);
      if (res.data?.data) {
        localStorage.setItem('cineverse_user', JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch (err) {
      console.warn('Backend update profile failed, updating local storage profile');
    }

    const current = await userApi.getProfile();
    const updated: User = {
      ...current,
      username: data.username ? data.username.trim() : current.username,
    };
    localStorage.setItem('cineverse_user', JSON.stringify(updated));
    return updated;
  },
};
