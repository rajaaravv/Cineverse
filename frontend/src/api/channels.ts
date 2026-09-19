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

export function cleanCategory(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/["'“”‘’]/g, '')              // remove all quotes
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width chars
    .replace(/[\r\n\t]/g, ' ')             // remove newlines/tabs
    .replace(/\s*([+&|-])\s*/g, '$1')      // normalize spaces around +, &, |, - (leave slashes intact for e.g. 24/7)
    .replace(/\s+/g, ' ')                  // collapse whitespace
    .trim();
}

export function matchCategory(channelGroup?: string | null, targetCategory?: string | null): boolean {
  if (!targetCategory || targetCategory.trim() === '') return true;

  const targetRaw = (targetCategory || '').replace(/^["']|["']$/g, '').trim();
  const groupRaw = (channelGroup || '').replace(/^["']|["']$/g, '').trim();

  // 1. Direct exact match (case-insensitive)
  if (groupRaw.toLowerCase() === targetRaw.toLowerCase()) {
    return true;
  }

  // 2. Default fallback for General
  if (!groupRaw && targetRaw.toLowerCase() === 'general') {
    return true;
  }

  const targetClean = cleanCategory(targetCategory);
  const groupClean = cleanCategory(channelGroup);

  if (!targetClean) return true;
  if (!groupClean) return targetClean === 'general';

  // 3. Cleaned match (normalized whitespace, quotes, casing, symbols)
  if (groupClean === targetClean) {
    return true;
  }

  // 4. Semicolon or comma-separated multi-category tags (e.g. "News; Live" or "Movies, Action")
  if (channelGroup && (channelGroup.includes(';') || channelGroup.includes(','))) {
    const subGroups = channelGroup.split(/[;,]/).map((s) => cleanCategory(s)).filter(Boolean);
    if (subGroups.includes(targetClean)) {
      return true;
    }
  }

  return false;
}

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
    // If local channels exist in localStorage, use them immediately for 0ms response
    const local = getAllLocalChannels();
    if (local.length > 0) {
      let filtered = local;
      if (params.playlistId !== undefined && params.playlistId !== null) {
        const byPl = local.filter((c) => Number(c.playlistId) === Number(params.playlistId));
        if (byPl.length > 0) filtered = byPl;
      }
      if (params.category && params.category.trim() !== '') {
        filtered = filtered.filter((c) => matchCategory(c.groupTitle, params.category));
      }
      return {
        content: filtered,
        totalElements: filtered.length,
        totalPages: 1,
        size: filtered.length || 48,
        number: 0,
        first: true,
        last: true,
        empty: filtered.length === 0,
      };
    }

    try {
      const res = await client.get<ApiResponse<PageResponse<Channel>>>('/channels', { params });
      if (res.data?.data?.content && res.data.data.content.length > 0) {
        return res.data.data;
      }
    } catch (err) {
      // Backend not reached
    }

    return {
      content: [],
      totalElements: 0,
      totalPages: 1,
      size: 48,
      number: 0,
      first: true,
      last: true,
      empty: true,
    };
  },

  searchChannels: async (query: string, params: ChannelFilterParams = {}): Promise<PageResponse<Channel>> => {
    const q = (query || '').trim().toLowerCase();
    const local = getAllLocalChannels();

    if (local.length > 0) {
      let filtered = local;
      if (params.playlistId !== undefined && params.playlistId !== null) {
        const byPl = local.filter((c) => Number(c.playlistId) === Number(params.playlistId));
        if (byPl.length > 0) filtered = byPl;
      }
      if (q) {
        filtered = filtered.filter((c) => {
          const name = (c.name || '').toLowerCase();
          const cat = (c.groupTitle || '').toLowerCase();
          return name.includes(q) || cat.includes(q);
        });
      }
      if (params.category && params.category.trim() !== '') {
        filtered = filtered.filter((c) => matchCategory(c.groupTitle, params.category));
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
    }

    try {
      const res = await client.get<ApiResponse<PageResponse<Channel>>>('/channels/search', {
        params: { ...params, query },
      });
      if (res.data?.data) {
        return res.data.data;
      }
    } catch (err) {}

    return {
      content: [],
      totalElements: 0,
      totalPages: 1,
      size: 24,
      number: 0,
      first: true,
      last: true,
      empty: true,
    };
  },

  getById: async (id: number): Promise<Channel> => {
    const all = getAllLocalChannels();
    const found = all.find((c) => Number(c.id) === Number(id));
    if (found) return found;

    try {
      const res = await client.get<ApiResponse<Channel>>(`/channels/${id}`);
      if (res.data?.data) return res.data.data;
    } catch (err) {}

    return FALLBACK_CHANNELS[0];
  },

  getCategories: async (playlistId?: number): Promise<Category[]> => {
    const all = getAllLocalChannels();
    if (all.length > 0) {
      let targetChannels = all;
      if (playlistId !== undefined && playlistId !== null) {
        const filtered = all.filter((c) => Number(c.playlistId) === Number(playlistId));
        if (filtered.length > 0) targetChannels = filtered;
      }
      const catMap = new Map<string, number>();

      targetChannels.forEach((c) => {
        const cat = (c.groupTitle || 'General').trim();
        if (cat) {
          catMap.set(cat, (catMap.get(cat) || 0) + 1);
        }
      });

      return Array.from(catMap.entries())
        .map(([name, channelCount]) => ({ name, channelCount }))
        .sort((a, b) => b.channelCount - a.channelCount);
    }

    try {
      const res = await client.get<ApiResponse<Category[]>>('/channels/categories', {
        params: playlistId !== undefined && playlistId !== null ? { playlistId } : {},
      });
      if (res.data?.data && res.data.data.length > 0) {
        return res.data.data;
      }
    } catch (err) {}

    return FALLBACK_CATEGORIES;
  },
};
