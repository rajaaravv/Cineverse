import client from './client';
import { ApiResponse, WatchHistory } from '../types';
import { FALLBACK_CHANNELS } from './channels';

const LOCAL_HISTORY_KEY = 'cineverse_history';

export const historyApi = {
  getAll: async (limit = 30): Promise<WatchHistory[]> => {
    try {
      const res = await client.get<ApiResponse<WatchHistory[]>>('/history', { params: { limit } });
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('Using local history fallback');
    }

    const saved = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (saved) return JSON.parse(saved).slice(0, limit);

    const initialHistory: WatchHistory[] = [
      {
        id: 1,
        channelId: 1,
        channelName: 'Scream VII - The Horror Movie Channel',
        tvgLogo: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
        groupTitle: 'Movies',
        streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        playlistId: 1,
        playlistName: 'Curated Cinema & News',
        lastWatchedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
      {
        id: 2,
        channelId: 2,
        channelName: 'Red Bull Extreme Sports HD',
        tvgLogo: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80',
        groupTitle: 'Sports',
        streamUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
        playlistId: 1,
        playlistName: 'Curated Cinema & News',
        lastWatchedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ];
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(initialHistory));
    return initialHistory;
  },

  record: async (channelId: number): Promise<WatchHistory> => {
    try {
      const res = await client.post<ApiResponse<WatchHistory>>(`/history/${channelId}`);
      return res.data.data;
    } catch (err) {
      const ch = FALLBACK_CHANNELS.find((c) => c.id === channelId) || FALLBACK_CHANNELS[0];
      const newEntry: WatchHistory = {
        id: Date.now(),
        channelId: ch.id,
        channelName: ch.name,
        tvgLogo: ch.tvgLogo,
        groupTitle: ch.groupTitle,
        streamUrl: ch.streamUrl,
        playlistId: ch.playlistId,
        playlistName: ch.playlistName,
        lastWatchedAt: new Date().toISOString(),
      };
      const saved = localStorage.getItem(LOCAL_HISTORY_KEY);
      let list: WatchHistory[] = saved ? JSON.parse(saved) : [];
      list = [newEntry, ...list.filter((item) => item.channelId !== channelId)].slice(0, 50);
      localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(list));
      return newEntry;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await client.delete('/history');
    } catch (err) {
      localStorage.removeItem(LOCAL_HISTORY_KEY);
    }
  },
};
