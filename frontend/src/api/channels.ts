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

export const FALLBACK_CHANNELS: Channel[] = [
  {
    id: 1,
    playlistId: 1,
    playlistName: 'Curated Cinema & News',
    name: 'Scream VII - The Horror Movie Channel',
    tvgId: 'Scream7.us',
    tvgName: 'Scream 7 Live',
    tvgLogo: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
    groupTitle: 'Movies',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    status: 'ACTIVE',
    favorite: true,
  },
  {
    id: 2,
    playlistId: 1,
    playlistName: 'Curated Cinema & News',
    name: 'Red Bull Extreme Sports HD',
    tvgId: 'RedBullTV.at',
    tvgName: 'Red Bull TV',
    tvgLogo: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80',
    groupTitle: 'Sports',
    streamUrl: 'https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8',
    status: 'ACTIVE',
    favorite: true,
  },
  {
    id: 3,
    playlistId: 1,
    playlistName: 'Curated Cinema & News',
    name: 'Bloomberg TV Global Markets',
    tvgId: 'Bloomberg.us',
    tvgName: 'Bloomberg TV',
    tvgLogo: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
    groupTitle: 'News',
    streamUrl: 'https://bloomberg-p2p.live.amagi.tv/hls/amagi_hls_data_bloomberg-p2p-samsungin/CDN/playlist.m3u8',
    status: 'ACTIVE',
    favorite: false,
  },
  {
    id: 4,
    playlistId: 1,
    playlistName: 'Curated Cinema & News',
    name: 'France 24 International Live',
    tvgId: 'France24.fr',
    tvgName: 'France 24 English',
    tvgLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/France_24_logo.svg/512px-France_24_logo.svg.png',
    groupTitle: 'News',
    streamUrl: 'https://static.france24.com/live/F24_EN_LO_HLS/live_web.m3u8',
    status: 'ACTIVE',
    favorite: false,
  },
  {
    id: 5,
    playlistId: 1,
    playlistName: 'Curated Cinema & News',
    name: 'DW World News English',
    tvgId: 'DW.de',
    tvgName: 'DW English',
    tvgLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Deutsche_Welle_symbol_2012.svg/512px-Deutsche_Welle_symbol_2012.svg.png',
    groupTitle: 'News',
    streamUrl: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8',
    status: 'ACTIVE',
    favorite: true,
  },
  {
    id: 6,
    playlistId: 1,
    playlistName: 'Curated Cinema & News',
    name: 'NASA TV Earth & Universe 4K',
    tvgId: 'NASA.us',
    tvgName: 'NASA TV Public',
    tvgLogo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    groupTitle: 'TV Shows',
    streamUrl: 'https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8',
    status: 'ACTIVE',
    favorite: true,
  },
  {
    id: 7,
    playlistId: 1,
    playlistName: 'Curated Cinema & News',
    name: 'Tastemade Food & Travel 24/7',
    tvgId: 'Tastemade.us',
    tvgName: 'Tastemade',
    tvgLogo: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
    groupTitle: 'Reality',
    streamUrl: 'https://tastemade-samsungus.amagi.tv/playlist.m3u8',
    status: 'ACTIVE',
    favorite: false,
  },
  {
    id: 8,
    playlistId: 1,
    playlistName: 'Curated Cinema & News',
    name: 'Sintel Animated Fantasy Feature',
    tvgId: 'Sintel.org',
    tvgName: 'Sintel Stream',
    tvgLogo: 'https://bitdash-a.akamaihd.net/content/sintel/poster.png',
    groupTitle: 'Movies',
    streamUrl: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    status: 'ACTIVE',
    favorite: true,
  },
  {
    id: 9,
    playlistId: 1,
    playlistName: 'Curated Cinema & News',
    name: 'Euronews 24/7 Live Feed',
    tvgId: 'Euronews.fr',
    tvgName: 'Euronews English',
    tvgLogo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Euronews_logo_2016.svg/512px-Euronews_logo_2016.svg.png',
    groupTitle: 'News',
    streamUrl: 'https://euronews-euronews-world-1-au.samsung.wurl.tv/playlist.m3u8',
    status: 'ACTIVE',
    favorite: false,
  },
  {
    id: 10,
    playlistId: 1,
    playlistName: 'Curated Cinema & News',
    name: 'Predator Badlands Live Series',
    tvgId: 'Predator.us',
    tvgName: 'Predator Stream',
    tvgLogo: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    groupTitle: 'TV Shows',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    status: 'ACTIVE',
    favorite: false,
  },
];

export const FALLBACK_CATEGORIES: Category[] = [
  { name: 'Movies', channelCount: 4 },
  { name: 'Sports', channelCount: 3 },
  { name: 'TV Shows', channelCount: 5 },
  { name: 'News', channelCount: 6 },
  { name: 'Reality', channelCount: 2 },
];

function getAllLocalChannels(): Channel[] {
  try {
    const custom = JSON.parse(localStorage.getItem('cineverse_custom_channels') || '[]');
    if (Array.isArray(custom) && custom.length > 0) {
      return [...custom, ...FALLBACK_CHANNELS];
    }
  } catch (e) {}
  return FALLBACK_CHANNELS;
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
      // If none found for this specific playlistId, return all custom channels for it
      if (all.length === 0 && params.playlistId === 1) {
        all = FALLBACK_CHANNELS;
      }
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
