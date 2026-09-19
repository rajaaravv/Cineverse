import client from './client';
import { ApiResponse, Favorite } from '../types';
import { FALLBACK_CHANNELS } from './channels';

const LOCAL_FAVS_KEY = 'cineverse_favorites';

export const favoriteApi = {
  getAll: async (): Promise<Favorite[]> => {
    try {
      const res = await client.get<ApiResponse<Favorite[]>>('/favorites');
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('Using local favorites fallback');
    }

    const saved = localStorage.getItem(LOCAL_FAVS_KEY);
    if (saved) return JSON.parse(saved);

    // Initial demo favorites
    const initialFavs: Favorite[] = FALLBACK_CHANNELS.filter((c) => c.favorite).map((c) => ({
      id: c.id,
      channelId: c.id,
      channelName: c.name,
      tvgLogo: c.tvgLogo,
      groupTitle: c.groupTitle,
      streamUrl: c.streamUrl,
      playlistId: c.playlistId,
      playlistName: c.playlistName,
      createdAt: '2026-09-10T00:00:00',
    }));
    localStorage.setItem(LOCAL_FAVS_KEY, JSON.stringify(initialFavs));
    return initialFavs;
  },

  add: async (channelId: number): Promise<Favorite> => {
    try {
      const res = await client.post<ApiResponse<Favorite>>(`/favorites/${channelId}`);
      return res.data.data;
    } catch (err) {
      const ch = FALLBACK_CHANNELS.find((c) => c.id === channelId) || FALLBACK_CHANNELS[0];
      const newFav: Favorite = {
        id: Date.now(),
        channelId: ch.id,
        channelName: ch.name,
        tvgLogo: ch.tvgLogo,
        groupTitle: ch.groupTitle,
        streamUrl: ch.streamUrl,
        playlistId: ch.playlistId,
        playlistName: ch.playlistName,
        createdAt: new Date().toISOString(),
      };
      const all = await favoriteApi.getAll();
      const updated = [newFav, ...all.filter((f) => f.channelId !== channelId)];
      localStorage.setItem(LOCAL_FAVS_KEY, JSON.stringify(updated));
      return newFav;
    }
  },

  remove: async (channelId: number): Promise<void> => {
    try {
      await client.delete(`/favorites/${channelId}`);
    } catch (err) {
      const all = await favoriteApi.getAll();
      const updated = all.filter((f) => f.channelId !== channelId);
      localStorage.setItem(LOCAL_FAVS_KEY, JSON.stringify(updated));
    }
  },
};
