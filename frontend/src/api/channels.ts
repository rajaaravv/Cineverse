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
      return custom.map((c, index) => ({
        ...c,
        id: Number(c.id) || Date.now() + index,
        playlistId: Number(c.playlistId) || 0,
        groupTitle: typeof c.groupTitle === 'string' && c.groupTitle.trim() ? c.groupTitle.trim() : 'General',
        name: typeof c.name === 'string' && c.name.trim() ? c.name.trim() : `Channel ${index + 1}`,
      }));
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

    if (params.playlistId !== undefined && params.playlistId !== null) {
      all = all.filter((c) => Number(c.playlistId) === Number(params.playlistId));
    }

    if (params.category && params.category.trim() !== '') {
      const targetCat = params.category.trim().toLowerCase();
      all = all.filter((c) => {
        const cat = (c.groupTitle || 'General').trim().toLowerCase();
        return cat === targetCat;
      });
    }

    return {
      content: all,
      totalElements: all.length,
      totalPages: 1,
      size: all.length || 48,
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

    const q = (query || '').trim().toLowerCase();
    let all = getAllLocalChannels();

    if (params.playlistId !== undefined && params.playlistId !== null) {
      all = all.filter((c) => Number(c.playlistId) === Number(params.playlistId));
    }

    let filtered = all.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const cat = (c.groupTitle || '').toLowerCase();
      return name.includes(q) || cat.includes(q);
    });

    if (params.category && params.category.trim() !== '') {
      const targetCat = params.category.trim().toLowerCase();
      filtered = filtered.filter((c) => {
        const cat = (c.groupTitle || 'General').trim().toLowerCase();
        return cat === targetCat;
      });
    }

    return {
      content: filtered,
      totalElements: filtered.length,
      totalPages: 1,
      size: filtered.length || 24,
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
    const found = all.find((c) => Number(c.id) === Number(id));
    if (found) return found;
    return FALLBACK_CHANNELS[0];
  },

  getCategories: async (playlistId?: number): Promise<Category[]> => {
    try {
      const res = await client.get<ApiResponse<Category[]>>('/channels/categories', {
        params: playlistId !== undefined && playlistId !== null ? { playlistId } : {},
      });
      if (res.data?.data && res.data.data.length > 0) {
        return res.data.data;
      }
    } catch (err) {}

    const all = getAllLocalChannels();
    const targetChannels = (playlistId !== undefined && playlistId !== null)
      ? all.filter((c) => Number(c.playlistId) === Number(playlistId))
      : all;
    const catMap = new Map<string, number>();

    targetChannels.forEach((c) => {
      const cat = (c.groupTitle || 'General').trim();
      if (cat) {
        catMap.set(cat, (catMap.get(cat) || 0) + 1);
      }
    });

    if (catMap.size === 0) return FALLBACK_CATEGORIES;

    return Array.from(catMap.entries()).map(([name, channelCount]) => ({
      name,
      channelCount,
    }));
  },
};
