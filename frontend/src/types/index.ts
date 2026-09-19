export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt?: string;
  playlistCount?: number;
  favoriteCount?: number;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface Playlist {
  id: number;
  name: string;
  sourceUrl?: string | null;
  isUrl: boolean;
  channelCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Channel {
  id: number;
  playlistId: number;
  playlistName: string;
  name: string;
  tvgId?: string | null;
  tvgName?: string | null;
  tvgLogo?: string | null;
  groupTitle: string;
  streamUrl: string;
  status: string;
  favorite: boolean;
}

export interface Category {
  name: string;
  channelCount: number;
}

export interface Favorite {
  id: number;
  channelId: number;
  channelName: string;
  tvgLogo?: string | null;
  groupTitle: string;
  streamUrl: string;
  playlistId: number;
  playlistName: string;
  createdAt: string;
}

export interface WatchHistory {
  id: number;
  channelId: number;
  channelName: string;
  tvgLogo?: string | null;
  groupTitle: string;
  streamUrl: string;
  playlistId: number;
  playlistName: string;
  lastWatchedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
