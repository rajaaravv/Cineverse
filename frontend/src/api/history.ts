import client from './client';
import { ApiResponse, Channel, WatchHistory } from '../types';

const LOCAL_HISTORY_KEY = 'cineverse_history';

export const historyApi = {
  getAll: async (limit = 30): Promise<WatchHistory[]> => {
    try {
      const res = await client.get<ApiResponse<WatchHistory[]>>('/history', { params: { limit } });
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data;
      }
    } catch (err) {
      // Backend not reached, use local history
    }

    const saved = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy mock demo channels
          const filtered = parsed.filter(
            (item: WatchHistory) =>
              item.playlistName !== 'Curated Cinema & News' &&
              item.playlistName !== 'World Sports & Live TV' &&
              item.channelName !== 'Scream VII - The Horror Movie Channel' &&
              item.channelName !== 'Red Bull Extreme Sports HD'
          );
          if (filtered.length !== parsed.length) {
            localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(filtered));
          }
          return filtered.slice(0, limit);
        }
      } catch (e) {}
    }

    return [];
  },

  record: async (channelId: number, channelData?: Channel): Promise<WatchHistory | null> => {
    try {
      const res = await client.post<ApiResponse<WatchHistory>>(`/history/${channelId}`);
      if (res.data?.data) return res.data.data;
    } catch (err) {
      // Fall through to local recording
    }

    let ch = channelData;
    if (!ch) {
      try {
        const stored = JSON.parse(localStorage.getItem('cineverse_custom_channels') || '[]');
        ch = stored.find((c: Channel) => Number(c.id) === Number(channelId));
      } catch (e) {}
    }

    if (!ch) return null;

    const newEntry: WatchHistory = {
      id: Date.now(),
      channelId: Number(ch.id),
      channelName: ch.name || 'Live Channel',
      tvgLogo: ch.tvgLogo,
      groupTitle: ch.groupTitle || 'General',
      streamUrl: ch.streamUrl,
      playlistId: Number(ch.playlistId) || 0,
      playlistName: ch.playlistName || 'My Playlist',
      lastWatchedAt: new Date().toISOString(),
    };

    const saved = localStorage.getItem(LOCAL_HISTORY_KEY);
    let list: WatchHistory[] = [];
    try {
      if (saved) list = JSON.parse(saved);
    } catch (e) {}

    list = [newEntry, ...list.filter((item) => Number(item.channelId) !== Number(channelId))].slice(0, 50);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(list));
    return newEntry;
  },

  clear: async (): Promise<void> => {
    try {
      await client.delete('/history');
    } catch (err) {}
    localStorage.removeItem(LOCAL_HISTORY_KEY);
  },
};
