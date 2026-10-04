import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { channelApi, matchCategory } from '../api/channels';
import { playlistApi } from '../api/playlists';
import { favoriteApi } from '../api/favorites';
import { historyApi } from '../api/history';
import { Channel, Category, Favorite, WatchHistory } from '../types';
import { ChannelCard } from '../components/ChannelCard';
import { CategoryFilter } from '../components/CategoryFilter';
import { PlaylistSwitcher } from '../components/PlaylistSwitcher';
import { usePlayer } from '../context/PlayerContext';
import { Play, Sparkles, Plus, Star, History, Search, X } from 'lucide-react';

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  // Load favorites and watch history
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [favList, histList] = await Promise.all([
          favoriteApi.getAll().catch(() => []),
          historyApi.getAll(10).catch(() => []),
        ]);
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

  // Derive categories dynamically from loaded channels so they 100% match!
  const categories: Category[] = React.useMemo(() => {
    const map = new Map<string, number>();
    allChannels.forEach((c) => {
      const raw = (c.groupTitle || 'General').replace(/^["']|["']$/g, '').trim();
      const cat = raw || 'General';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, channelCount]) => ({ name, channelCount }))
      .sort((a, b) => b.channelCount - a.channelCount);
  }, [allChannels]);

  // Instant reactive category and in-page search query filtering
  const safeChannels = React.useMemo(() => {
    let list = allChannels;

    if (selectedCategory) {
      list = list.filter((c) => matchCategory(c.groupTitle, selectedCategory));
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      list = list.filter((c) => {
        const name = (c.name || '').toLowerCase();
        const group = (c.groupTitle || '').toLowerCase();
        const tvgName = (c.tvgName || '').toLowerCase();
        const tvgId = (c.tvgId || '').toLowerCase();
        const full = `${name} ${group} ${tvgName} ${tvgId}`;
        return tokens.every((token) => full.includes(token));
      });
    }

    return list;
  }, [allChannels, selectedCategory, searchQuery]);

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

  const isBrowsingAll = !selectedCategory && !searchQuery.trim();

  // Progressive batch rendering to completely eliminate DOM overload and scroll lag
  const CHUNK_SIZE = 48;
  const [visibleCount, setVisibleCount] = useState<number>(CHUNK_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset pagination when category, search query, or active playlist changes
  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
  }, [selectedCategory, searchQuery, activePlaylistId]);

  const displayedChannels = useMemo(() => {
    return safeChannels.slice(0, visibleCount);
  }, [safeChannels, visibleCount]);

  // Infinite scroll observer for butter-smooth progressive loading
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < safeChannels.length) {
          setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, safeChannels.length));
        }
      },
      { rootMargin: '600px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [visibleCount, safeChannels.length]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 font-sans">
      {/* Top Filter, In-Page Search & Playlist Switcher Row */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          {/* In-page Instant Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channels, sports, news, movies..."
              className="w-full rounded-lg border border-border bg-card pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
            {/* Playlist Switcher Button */}
            <PlaylistSwitcher
              selectedPlaylistId={activePlaylistId}
              onSelectPlaylist={handlePlaylistChange}
              onOpenAddPlaylist={onOpenAddPlaylist}
            />
          </div>
        </div>

        {/* Category Pills Bar */}
        <CategoryFilter
          categories={Array.isArray(categories) ? categories : []}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />
      </div>

      {/* Featured Spotlight / Continue Watching Hero Card (only when browsing all channels without search) */}
      {isBrowsingAll && spotlightChannel && (
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          {/* Hero Poster Media */}
          <div className="relative h-[220px] sm:h-[300px] md:h-[340px] w-full overflow-hidden bg-background">
            {spotlightChannel.tvgLogo ? (
              <img
                src={spotlightChannel.tvgLogo}
                alt={spotlightChannel.name}
                className="h-full w-full object-cover object-center opacity-25 blur-xs scale-105"
                decoding="async"
              />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80"
                alt={spotlightChannel.name}
                className="h-full w-full object-cover object-center opacity-30 transform transition duration-500 hover:scale-102"
                decoding="async"
              />
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/60 pointer-events-none" />

            {/* Hero Content Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 p-4 sm:p-6 space-y-2.5 sm:space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-md bg-secondary/80 backdrop-blur-md px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground border border-border shadow-sm">
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
                <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-lg bg-secondary border border-border flex items-center justify-center p-1.5 sm:p-2 shadow-sm">
                  <img src={spotlightChannel.tvgLogo} alt={spotlightChannel.name} className="h-full w-full object-contain" />
                </div>
              )}

              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground drop-shadow-lg max-w-2xl truncate px-2">
                {spotlightChannel.name}
              </h1>

              <p className="text-[11px] sm:text-xs text-muted-foreground max-w-lg drop-shadow font-mono px-2">
                {spotlightChannel.groupTitle || 'IPTV Stream'} • {spotlightChannel.playlistName || 'Cineverse Live'}
              </p>

              <button
                onClick={() => playChannel(spotlightChannel, safeChannels.length > 0 ? safeChannels : [spotlightChannel])}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition transform active:scale-95"
              >
                <Play className="h-4 w-4 fill-current ml-0.5" />
                <span>{isRecentSpotlight ? 'Resume Stream' : 'Watch Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Favorites Shelf (only on All Channels view without active search) */}
      {isBrowsingAll && favoriteChannels.length > 0 && (
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

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 no-scrollbar">
            {favoriteChannels.map((ch) => (
              <div key={ch.id} className="w-[145px] sm:w-[185px] shrink-0">
                <ChannelCard channel={ch} queueContext={favoriteChannels} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Picks Shelf (only on All Channels view without active search) */}
      {isBrowsingAll && horizontalPicks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
              <span>Featured Picks</span>
              <Sparkles className="h-4 w-4 text-foreground" />
            </h2>
            <span className="text-xs text-muted-foreground hover:text-foreground font-mono">
              Curated Streams
            </span>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 no-scrollbar">
            {horizontalPicks.map((ch) => (
              <div key={ch.id} className="w-[145px] sm:w-[185px] shrink-0">
                <ChannelCard channel={ch} queueContext={safeChannels} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Channels Grid / Full Catalog */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-1">
          <div>
            <h2 className="text-base font-bold text-foreground tracking-tight">
              {searchQuery.trim()
                ? `Results for "${searchQuery}"${selectedCategory ? ` in ${selectedCategory}` : ''}`
                : selectedCategory
                ? `${selectedCategory}`
                : 'Explore Live Streams'}
            </h2>
            <p className="text-xs text-muted-foreground font-mono">
              Showing {displayedChannels.length} of {safeChannels.length} channels
            </p>
          </div>
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
              {searchQuery.trim()
                ? `No channels match "${searchQuery}". Try a different keyword.`
                : selectedCategory
                ? `No channels found matching "${selectedCategory}".`
                : 'Try choosing another category, switching playlists, or import an M3U playlist.'}
            </p>
            {selectedCategory || searchQuery.trim() ? (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery('');
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-secondary border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent transition"
              >
                <span>View All Channels</span>
              </button>
            ) : (
              <button
                onClick={onOpenAddPlaylist}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Import Playlist</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {displayedChannels.map((channel, index) => (
                <ChannelCard
                  key={`${channel.id}-${index}`}
                  channel={channel}
                  queueContext={safeChannels}
                />
              ))}
            </div>

            {/* Progressive Infinite Scroll Sentinel & Load More trigger */}
            {visibleCount < safeChannels.length && (
              <div ref={sentinelRef} className="pt-6 pb-2 flex flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, safeChannels.length))}
                  className="rounded-lg bg-secondary border border-border px-5 py-2 text-xs font-semibold text-foreground hover:bg-accent transition shadow-sm active:scale-95"
                >
                  Load More Channels ({safeChannels.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default ChannelsPage;
