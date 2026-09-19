import React from 'react';
import { Channel } from '../types';
import { ChannelCard } from './ChannelCard';
import { Tv, Sparkles } from 'lucide-react';

interface ChannelGridProps {
  channels: Channel[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onOpenAddPlaylist?: () => void;
  onFavoriteChange?: (channelId: number, isFav: boolean) => void;
}

export const ChannelGrid: React.FC<ChannelGridProps> = ({
  channels,
  isLoading = false,
  emptyTitle = 'No channels found',
  emptyDescription = 'Try adjusting your search query, selecting another category, or importing a playlist.',
  onOpenAddPlaylist,
  onFavoriteChange,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 font-sans">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-[#222222] bg-[#0d0d0d] p-3 space-y-3">
            <div className="aspect-[3/4] w-full rounded-md bg-[#161616]" />
            <div className="h-3 w-3/4 rounded bg-[#1f1f1f]" />
            <div className="h-2.5 w-1/2 rounded bg-[#161616]" />
          </div>
        ))}
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#262626] bg-[#0d0d0d] py-16 px-6 text-center font-sans">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black border border-[#262626] text-white">
          <Tv className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-white">{emptyTitle}</h3>
        <p className="mt-1.5 max-w-sm text-xs text-[#888888]">{emptyDescription}</p>
        {onOpenAddPlaylist && (
          <button
            onClick={onOpenAddPlaylist}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black shadow-sm hover:bg-[#e5e5e5] transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Import M3U Playlist</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 font-sans">
      {channels.map((channel) => (
        <ChannelCard
          key={channel.id}
          channel={channel}
          queueContext={channels}
          onFavoriteChange={onFavoriteChange}
        />
      ))}
    </div>
  );
};
