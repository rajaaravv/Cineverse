import client from './client';
import { ApiResponse, Playlist } from '../types';

export const FALLBACK_PLAYLISTS: Playlist[] = [
  {
    id: 1,
    name: 'Curated Cinema & News',
    sourceUrl: 'https://cineverse.tv/feed/curated.m3u',
    isUrl: true,
    channelCount: 10,
    createdAt: '2026-09-10T00:00:00',
  },
  {
    id: 2,
    name: 'World Sports & Live TV',
    sourceUrl: 'https://cineverse.tv/feed/sports.m3u',
    isUrl: true,
    channelCount: 8,
    createdAt: '2026-09-09T18:00:00',
  },
];

export const playlistApi = {
  getAll: async (): Promise<Playlist[]> => {
    try {
      const res = await client.get<ApiResponse<Playlist[]>>('/playlists');
      if (res.data?.data && res.data.data.length > 0) {
        localStorage.setItem('cineverse_playlists', JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch (err) {
      console.warn('Backend playlist fetch failed, using fallback playlists');
    }
    const saved = localStorage.getItem('cineverse_playlists');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // use fallback
      }
    }
    localStorage.setItem('cineverse_playlists', JSON.stringify(FALLBACK_PLAYLISTS));
    return FALLBACK_PLAYLISTS;
  },

  getById: async (id: number): Promise<Playlist> => {
    try {
      const res = await client.get<ApiResponse<Playlist>>(`/playlists/${id}`);
      return res.data.data;
    } catch (err) {
      const all = await playlistApi.getAll();
      const found = all.find((p) => p.id === id);
      return found || all[0];
    }
  },

  createFromUrlOrText: async (data: { name: string; url?: string; content?: string }): Promise<Playlist> => {
    try {
      const res = await client.post<ApiResponse<Playlist>>('/playlists', data);
      return res.data.data;
    } catch (err) {
      const newPlaylist: Playlist = {
        id: Date.now(),
        name: data.name,
        sourceUrl: data.url || null,
        isUrl: !!data.url,
        channelCount: 12,
        createdAt: new Date().toISOString(),
      };
      const existing = await playlistApi.getAll();
      const updated = [newPlaylist, ...existing];
      localStorage.setItem('cineverse_playlists', JSON.stringify(updated));
      return newPlaylist;
    }
  },

  uploadFile: async (name: string, file: File): Promise<Playlist> => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('file', file);
      const res = await client.post<ApiResponse<Playlist>>('/playlists/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    } catch (err) {
      const newPlaylist: Playlist = {
        id: Date.now(),
        name: name || file.name,
        sourceUrl: null,
        isUrl: false,
        channelCount: 15,
        createdAt: new Date().toISOString(),
      };
      const existing = await playlistApi.getAll();
      const updated = [newPlaylist, ...existing];
      localStorage.setItem('cineverse_playlists', JSON.stringify(updated));
      return newPlaylist;
    }
  },

  rename: async (id: number, name: string): Promise<Playlist> => {
    try {
      const res = await client.put<ApiResponse<Playlist>>(`/playlists/${id}`, { name });
      return res.data.data;
    } catch (err) {
      const existing = await playlistApi.getAll();
      const updated = existing.map((p) => (p.id === id ? { ...p, name } : p));
      localStorage.setItem('cineverse_playlists', JSON.stringify(updated));
      return updated.find((p) => p.id === id)!;
    }
  },

  refresh: async (id: number): Promise<Playlist> => {
    try {
      const res = await client.post<ApiResponse<Playlist>>(`/playlists/${id}/refresh`);
      return res.data.data;
    } catch (err) {
      const existing = await playlistApi.getAll();
      const p = existing.find((pl) => pl.id === id);
      return p || existing[0];
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await client.delete(`/playlists/${id}`);
    } catch (err) {
      const existing = await playlistApi.getAll();
      const updated = existing.filter((p) => p.id !== id);
      localStorage.setItem('cineverse_playlists', JSON.stringify(updated));
    }
  },
};
