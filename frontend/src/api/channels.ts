import client from './client';
import { ApiResponse, Category, Channel, PageResponse } from '../types';

export interface ChannelFilterParams {
  playlistId?: number;
  category?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export const FALLBACK_CHANNELS: Channel[] = [];

export const FALLBACK_CATEGORIES: Category[] = [];

function getAllLocalChannels(): Channel[] {
  try {
    const custom = JSON.parse(localStorage.getItem('cineverse_custom_channels') || '[]');
    if (Array.isArray(custom)) {
      return custom;
    }
  } catch (e) {}
  return [];
}

export const channelApi = {
  getChannels: async (params: ChannelFilterParams = {}): Promise<PageResponse<Channel>> => {
    try {
      const res = await client.get<ApiResponse<PageResponse<Channel>>>('/channels', { params });
      if (res.data?.data?.content && res.data.data.content.length > 0) {
        return res.data.data;
      }
    } catch (err) {
      // Backend not reached, proceed with local channels
    }

    let all = getAllLocalChannels();

    if (params.playlistId) {
      all = all.filter((c) => c.playlistId === params.playlistId);
    }

    if (params.category) {
      all = all.filter(
        (c) => c.groupTitle.toLowerCase() === params.category!.toLowerCase()
      );
    }

    return {
      content: all,
      totalElements: all.length,
      totalPages: 1,
      size: 48,
      number: 0,
      first: true,
      last: true,
      empty: all.length === 0,
    };
  },

  searchChannels: async (query: string, params: ChannelFilterParams = {}): Promise<PageResponse<Channel>> => {
    try {
      const res = await client.get<ApiResponse<PageResponse<Channel>>>('/channels/search', {
        params: { ...params, query },
      });
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err) {
      // Backend not reached, proceed with local search
    }

    const q = query.toLowerCase();
    let all = getAllLocalChannels();

    if (params.playlistId) {
      all = all.filter((c) => c.playlistId === params.playlistId);
    }

    let filtered = all.filter(
      (c) => c.name.toLowerCase().includes(q) || c.groupTitle.toLowerCase().includes(q)
    );

    if (params.category) {
      filtered = filtered.filter(
        (c) => c.groupTitle.toLowerCase() === params.category!.toLowerCase()
      );
    }

    return {
      content: filtered,
      totalElements: filtered.length,
      totalPages: 1,
      size: 24,
      number: 0,
      first: true,
      last: true,
      empty: filtered.length === 0,
    };
  },

  getById: async (id: number): Promise<Channel> => {
    try {
      const res = await client.get<ApiResponse<Channel>>(`/channels/${id}`);
      if (res.data?.data) return res.data.data;
    } catch (err) {}

    const all = getAllLocalChannels();
    const found = all.find((c) => c.id === id);
    if (found) return found;
    return FALLBACK_CHANNELS[0];
  },

  getCategories: async (playlistId?: number): Promise<Category[]> => {
    try {
      const res = await client.get<ApiResponse<Category[]>>('/channels/categories', {
        params: playlistId ? { playlistId } : {},
      });
      if (res.data?.data && res.data.data.length > 0) {
        return res.data.data;
      }
    } catch (err) {}

    const all = getAllLocalChannels();
    const targetChannels = playlistId ? all.filter((c) => c.playlistId === playlistId) : all;
    const catMap = new Map<string, number>();

    targetChannels.forEach((c) => {
      const cat = c.groupTitle || 'General';
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });

    if (catMap.size === 0) return FALLBACK_CATEGORIES;

    return Array.from(catMap.entries()).map(([name, channelCount]) => ({
      name,
      channelCount,
    }));
  },
};
