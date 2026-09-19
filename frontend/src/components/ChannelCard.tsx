import React, { useState } from 'react';
import { Play, Star, Tv } from 'lucide-react';
import { Channel } from '../types';
import { favoriteApi } from '../api/favorites';
import { usePlayer } from '../context/PlayerContext';

interface ChannelCardProps {
  channel: Channel;
  queueContext?: Channel[];
  onFavoriteChange?: (channelId: number, isFav: boolean) => void;
  aspectRatio?: 'poster' | 'video';
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  queueContext,
  onFavoriteChange,
  aspectRatio = 'poster',
}) => {
  const { playChannel, currentChannel, toggleFavoriteState } = usePlayer();
  const [isFavorite, setIsFavorite] = useState<boolean>(channel.favorite);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);

  const isCurrentlyPlaying = currentChannel?.id === channel.id;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isFavorite) {
        await favoriteApi.remove(channel.id);
        setIsFavorite(false);
        toggleFavoriteState(channel.id, false);
        onFavoriteChange?.(channel.id, false);
      } else {
        await favoriteApi.add(channel.id);
        setIsFavorite(true);
        toggleFavoriteState(channel.id, true);
        onFavoriteChange?.(channel.id, true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const handleCardClick = () => {
    playChannel(channel, queueContext);
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-card transition-all duration-200 hover:-translate-y-0.5 font-sans ${
        isCurrentlyPlaying
          ? 'border-primary ring-1 ring-ring shadow-sm'
          : 'border-border hover:border-muted-foreground/40 shadow-sm'
      }`}
    >
      {/* Media Image Container */}
      <div
        className={`relative w-full overflow-hidden bg-muted ${
          aspectRatio === 'poster' ? 'aspect-[3/4]' : 'aspect-video'
        }`}
      >
        {channel.tvgLogo && !imgError ? (
          <img
            src={channel.tvgLogo}
            alt={channel.name}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-muted p-4 text-center">
            <Tv className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-xs font-semibold text-card-foreground truncate max-w-[90%]">{channel.name}</span>
            <span className="mt-1 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{channel.groupTitle}</span>
          </div>
        )}

        {/* Ambient Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Top Badges: Category & Favorite */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
          <span className="rounded-md bg-background/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider text-muted-foreground border border-border shadow-sm">
            {channel.groupTitle || 'Live'}
          </span>

          <button
            onClick={handleToggleFavorite}
            className={`rounded-md p-1.5 backdrop-blur-md border transition shadow-sm ${
              isFavorite
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background/80 border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center Hover Play Button */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition duration-200 ${
            isHovered || isCurrentlyPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Play className="h-4 w-4 fill-current ml-0.5" />
          </div>
        </div>

        {/* Bottom Details Overlay */}
        <div className="absolute bottom-2.5 inset-x-2.5 z-10">
          <h3 className="truncate text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition" title={channel.name}>
            {channel.name}
          </h3>
          <p className="truncate text-[11px] text-muted-foreground font-mono" title={channel.playlistName}>
            {channel.playlistName || 'Live'}
          </p>

          {isCurrentlyPlaying && (
            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono font-semibold text-foreground uppercase tracking-wider">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              <span>Playing Now</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
