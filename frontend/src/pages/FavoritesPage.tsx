import React, { useEffect, useState } from 'react';
import { favoriteApi } from '../api/favorites';
import { Favorite, Channel } from '../types';
import { ChannelCard } from '../components/ChannelCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Star, Tv } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const data = await favoriteApi.getAll();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to load favorites', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleFavoriteChange = (channelId: number, isFav: boolean) => {
    if (!isFav) {
      setFavorites((prev) => prev.filter((f) => f.channelId !== channelId));
    }
  };

  const channels: Channel[] = favorites.map((fav) => ({
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

  if (isLoading) {
    return <LoadingSpinner message="Loading your Cineverse favorites..." />;
  }

  return (
    <div className="space-y-6 pb-24 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Star className="h-5 w-5 fill-foreground text-foreground" />
            <span>Favorite Channels</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            {favorites.length} saved channels pinned for instant one-click streaming
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary border border-border text-foreground">
            <Star className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">No favorite channels yet</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Tap the star icon on any channel card to quickly pin it to your favorites for instant access.
          </p>
          <Link
            to="/channels"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
          >
            <Tv className="h-4 w-4" />
            <span>Browse Channels</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {channels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              queueContext={channels}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};
