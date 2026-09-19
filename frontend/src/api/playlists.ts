import client from './client';
import { ApiResponse, Playlist } from '../types';

export const FALLBACK_PLAYLISTS: Playlist[] = [];

export const playlistApi = {
  getAll: async (): Promise<Playlist[]> => {
    try {
      const res = await client.get<ApiResponse<Playlist[]>>('/playlists');
      if (res.data?.data && Array.isArray(res.data.data)) {
        localStorage.setItem('cineverse_playlists', JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch (err) {
      // Backend not reached, check local storage
    }
    const saved = localStorage.getItem('cineverse_playlists');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
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
      if (res.data?.data) return res.data.data;
    } catch (err) {
      console.warn('Backend playlist creation failed, using local parser');
    }

    const playlistId = Date.now();
    let channels: any[] = [];
    let rawContent = data.content || '';

    // If URL is provided, try to fetch the text content
    if (data.url && !rawContent) {
      try {
        const response = await fetch(data.url);
        if (response.ok) {
          rawContent = await response.text();
        }
      } catch (fetchErr) {
        console.warn('Direct fetch failed due to CORS, attempting via proxy or creating stream channel');
        try {
          const proxyRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(data.url)}`);
          if (proxyRes.ok) {
            rawContent = await proxyRes.text();
          }
        } catch (proxyErr) {
          console.warn('Proxy fetch also failed');
        }
      }
    }

    const { parseM3UContent } = await import('../utils/m3uParser');

    if (rawContent) {
      channels = parseM3UContent(rawContent, playlistId, data.name);
    }

    // If still no channels parsed from URL (e.g. single stream URL), create single channel entry
    if (channels.length === 0 && data.url) {
      channels = [
        {
          id: playlistId * 10 + 1,
          playlistId,
          playlistName: data.name,
          name: `${data.name} Live Stream`,
          groupTitle: 'General',
          streamUrl: data.url,
          status: 'ACTIVE',
          favorite: false,
        },
      ];
    }

    const newPlaylist: Playlist = {
      id: playlistId,
      name: data.name,
      sourceUrl: data.url || null,
      isUrl: !!data.url,
      channelCount: channels.length > 0 ? channels.length : 1,
      createdAt: new Date().toISOString(),
    };

    const existing = await playlistApi.getAll();
    const updated = [newPlaylist, ...existing];
    localStorage.setItem('cineverse_playlists', JSON.stringify(updated));

    if (channels.length > 0) {
      try {
        const storedChannels = JSON.parse(localStorage.getItem('cineverse_custom_channels') || '[]');
        localStorage.setItem('cineverse_custom_channels', JSON.stringify([...channels, ...storedChannels]));
      } catch (e) {}
    }

    return newPlaylist;
  },

  uploadFile: async (name: string, file: File): Promise<Playlist> => {
    let fileText = '';
    try {
      fileText = await file.text();
    } catch (e) {}

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('file', file);
      const res = await client.post<ApiResponse<Playlist>>('/playlists/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data) return res.data.data;
    } catch (err) {
      console.warn('Backend upload failed, parsing M3U in browser');
    }

    const playlistId = Date.now();
    const playlistName = name || file.name.replace(/\.(m3u|m3u8)$/i, '');
    let channels: any[] = [];

    if (fileText) {
      const { parseM3UContent } = await import('../utils/m3uParser');
      channels = parseM3UContent(fileText, playlistId, playlistName);
    }

    const newPlaylist: Playlist = {
      id: playlistId,
      name: playlistName,
      sourceUrl: null,
      isUrl: false,
      channelCount: channels.length > 0 ? channels.length : 15,
      createdAt: new Date().toISOString(),
    };

    const existing = await playlistApi.getAll();
    const updated = [newPlaylist, ...existing];
    localStorage.setItem('cineverse_playlists', JSON.stringify(updated));

    if (channels.length > 0) {
      try {
        const storedChannels = JSON.parse(localStorage.getItem('cineverse_custom_channels') || '[]');
        localStorage.setItem('cineverse_custom_channels', JSON.stringify([...channels, ...storedChannels]));
      } catch (e) {}
    }

    return newPlaylist;
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
