import React, { useEffect, useState, useCallback } from 'react';
import { channelApi } from '../api/channels';
import { playlistApi } from '../api/playlists';
import { favoriteApi } from '../api/favorites';
import { historyApi } from '../api/history';
import { Channel, Category, Favorite, WatchHistory } from '../types';
import { ChannelCard } from '../components/ChannelCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { PlaylistSwitcher } from '../components/PlaylistSwitcher';
import { usePlayer } from '../context/PlayerContext';
import { Play, Sparkles, Plus, Star, History } from 'lucide-react';

interface ChannelsPageProps {
  onOpenAddPlaylist: () => void;
  selectedPlaylistId?: number;
  onSelectPlaylist?: (id: number | undefined) => void;
}

export const ChannelsPage: React.FC<ChannelsPageProps> = ({
  onOpenAddPlaylist,
  selectedPlaylistId: externalPlaylistId,
  onSelectPlaylist: externalSelectPlaylist,
}) => {
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [internalPlaylistId, setInternalPlaylistId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Favorites & Watch History items
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [historyItems, setHistoryItems] = useState<WatchHistory[]>([]);

  const activePlaylistId = externalPlaylistId !== undefined ? externalPlaylistId : internalPlaylistId;
  const handlePlaylistChange = (id: number | undefined) => {
    setSelectedCategory(null);
    if (externalSelectPlaylist) {
      externalSelectPlaylist(id);
    } else {
      setInternalPlaylistId(id);
    }
  };

  const { playChannel } = usePlayer();

  // Load categories and metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catList, favList, histList] = await Promise.all([
          channelApi.getCategories(activePlaylistId).catch(() => []),
          favoriteApi.getAll().catch(() => []),
          historyApi.getAll(10).catch(() => []),
        ]);
        if (Array.isArray(catList)) setCategories(catList);
        if (Array.isArray(favList)) setFavorites(favList);
        if (Array.isArray(histList)) setHistoryItems(histList);
      } catch (err) {
        console.error('Failed to load metadata', err);
      }
    };
    fetchMetadata();
  }, [activePlaylistId]);

  // Load all channels for active playlist
  const loadChannels = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await channelApi.getChannels({
        playlistId: activePlaylistId,
        page: 0,
        size: 5000,
        sortBy: 'name',
        sortDir: 'asc',
      });

      if (response && Array.isArray(response.content)) {
        setAllChannels(response.content);
      } else {
        setAllChannels([]);
      }
    } catch (err) {
      console.error('Failed to load channels', err);
      setAllChannels([]);
    } finally {
      setIsLoading(false);
    }
  }, [activePlaylistId]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // Instant reactive category filtering
  const safeChannels = React.useMemo(() => {
    if (!selectedCategory) return allChannels;
    const target = selectedCategory.trim().toLowerCase();
    return allChannels.filter((c) => (c.groupTitle || 'General').trim().toLowerCase() === target);
  }, [allChannels, selectedCategory]);

  const safeHistory = Array.isArray(historyItems) ? historyItems : [];
  const historyChannels: Channel[] = safeHistory.map((item) => ({
    id: item.channelId,
    playlistId: item.playlistId,
    playlistName: item.playlistName,
    name: item.channelName,
    tvgLogo: item.tvgLogo,
    groupTitle: item.groupTitle,
    streamUrl: item.streamUrl,
    status: 'ACTIVE',
    favorite: false,
  }));

  const safeFavorites = Array.isArray(favorites) ? favorites : [];
  const favoriteChannels: Channel[] = safeFavorites.map((fav) => ({
    id: fav.channelId,
    playlistId: fav.playlistId,
    playlistName: fav.playlistName,
    name: fav.channelName,
    tvgLogo: fav.tvgLogo,
    groupTitle: fav.groupTitle,
    streamUrl: fav.streamUrl,
    status: 'ACTIVE',
    favorite: true,
  }));

  // Spotlight channel: prioritize most recently watched channel, otherwise fallback to first channel in catalog
  const isRecentSpotlight = historyChannels.length > 0;
  const spotlightChannel = isRecentSpotlight 
    ? historyChannels[0] 
    : (safeChannels.length > 0 ? safeChannels[0] : null);

  const horizontalPicks = safeChannels.filter((c) => c.id !== spotlightChannel?.id).slice(0, 8);

  return (
    <div className="space-y-8 pb-24 font-sans">
      {/* Top Filter & Playlist Switcher Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CategoryFilter
          categories={Array.isArray(categories) ? categories : []}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Playlist Switcher Button */}
          <PlaylistSwitcher
            selectedPlaylistId={activePlaylistId}
            onSelectPlaylist={handlePlaylistChange}
            onOpenAddPlaylist={onOpenAddPlaylist}
          />
        </div>
      </div>

      {/* Featured Spotlight / Continue Watching Hero Card (only when All Channels is selected) */}
      {!selectedCategory && spotlightChannel && (
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {/* Hero Poster Media */}
          <div className="relative h-[280px] sm:h-[340px] w-full overflow-hidden bg-background">
            {spotlightChannel.tvgLogo ? (
              <img
                src={spotlightChannel.tvgLogo}
                alt={spotlightChannel.name}
                className="h-full w-full object-cover object-center opacity-25 blur-xs scale-105"
              />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80"
                alt={spotlightChannel.name}
                className="h-full w-full object-cover object-center opacity-30 transform transition duration-500 hover:scale-102"
              />
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/60" />

            {/* Hero Content Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 p-6 space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-md bg-secondary/80 backdrop-blur-md px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground border border-border shadow-sm">
                  {isRecentSpotlight ? (
                    <>
                      <History className="h-3.5 w-3.5 text-foreground" />
                      <span>Continue Watching • Recent Stream</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-foreground" />
                      <span>Trending Spotlight</span>
                    </>
                  )}
                </span>
              </div>

              {spotlightChannel.tvgLogo && (
                <div className="h-14 w-14 rounded-lg bg-secondary border border-border flex items-center justify-center p-2 shadow-sm">
                  <img src={spotlightChannel.tvgLogo} alt={spotlightChannel.name} className="h-full w-full object-contain" />
                </div>
              )}

              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground drop-shadow-lg max-w-2xl truncate">
                {spotlightChannel.name}
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg drop-shadow font-mono">
                {spotlightChannel.groupTitle || 'IPTV Stream'} • {spotlightChannel.playlistName || 'Cineverse Live'}
              </p>

              <button
                onClick={() => playChannel(spotlightChannel, safeChannels.length > 0 ? safeChannels : [spotlightChannel])}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition transform active:scale-95"
              >
                <Play className="h-4 w-4 fill-current ml-0.5" />
                <span>{isRecentSpotlight ? 'Resume Stream' : 'Watch Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Favorites Shelf (only on All Channels view) */}
      {!selectedCategory && favoriteChannels.length > 0 && (
        <section className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
              <Star className="h-4 w-4 fill-foreground text-foreground" />
              <span>Starred Favorites</span>
            </h2>
            <span className="text-xs font-mono text-muted-foreground">
              {favoriteChannels.length} saved
            </span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {favoriteChannels.map((ch) => (
              <div key={ch.id} className="w-[160px] sm:w-[195px] shrink-0">
                <ChannelCard channel={ch} queueContext={favoriteChannels} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Picks Shelf (only on All Channels view) */}
      {!selectedCategory && horizontalPicks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
              <span>Featured Picks</span>
              <Sparkles className="h-4 w-4 text-foreground" />
            </h2>
            <span className="text-xs text-muted-foreground hover:text-foreground hover:underline cursor-pointer font-medium">
              Explore All
            </span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {horizontalPicks.map((ch) => (
              <div key={ch.id} className="w-[160px] sm:w-[195px] shrink-0">
                <ChannelCard channel={ch} queueContext={safeChannels} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Channels Grid / Full Catalog */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground tracking-tight">
            {selectedCategory ? `${selectedCategory}` : 'Explore Live Streams'}
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            {safeChannels.length} channels available
          </span>
        </div>

        {isLoading && safeChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-8 w-8 animate-spin text-primary border-2 border-primary border-t-transparent rounded-full mb-3" />
            <span className="text-xs font-mono text-muted-foreground">Loading channels...</span>
          </div>
        ) : safeChannels.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16 px-6 text-center">
            <h3 className="text-base font-semibold text-foreground">No channels found</h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Try choosing another category, switching playlists, or import an M3U playlist.
            </p>
            <button
              onClick={onOpenAddPlaylist}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Import Playlist</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {safeChannels.map((channel) => (
              <ChannelCard
                key={channel.id}
                channel={channel}
                queueContext={safeChannels}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ChannelsPage;
