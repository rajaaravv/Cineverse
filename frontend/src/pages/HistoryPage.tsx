import React, { useEffect, useState } from 'react';
import { historyApi } from '../api/history';
import { WatchHistory, Channel } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { History, Play, Trash2, Tv } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Link } from 'react-router-dom';

export const HistoryPage: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<WatchHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { playChannel } = usePlayer();

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await historyApi.getAll(50);
      setHistoryItems(data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = async () => {
    if (!window.confirm('Clear all your Cineverse watch history?')) return;
    try {
      await historyApi.clear();
      setHistoryItems([]);
    } catch (err) {
      console.error('Failed to clear history', err);
    }
  };

  const handlePlayItem = (item: WatchHistory) => {
    const channel: Channel = {
      id: item.channelId,
      playlistId: item.playlistId,
      playlistName: item.playlistName,
      name: item.channelName,
      tvgLogo: item.tvgLogo,
      groupTitle: item.groupTitle,
      streamUrl: item.streamUrl,
      status: 'ACTIVE',
      favorite: false,
    };
    playChannel(channel);
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading watch history..." />;
  }

  return (
    <div className="space-y-6 pb-24 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="h-5 w-5 text-foreground" />
            <span>Watch History</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Recently watched channels. Tap any stream to resume immediately.
          </p>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary border border-border px-3.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {historyItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary border border-border text-foreground">
            <History className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">No watch history yet</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Channels and movies you stream will automatically appear here so you can jump right back in.
          </p>
          <Link
            to="/channels"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
          >
            <Tv className="h-4 w-4" />
            <span>Explore Channels</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {historyItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handlePlayItem(item)}
              className="group flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card p-3.5 transition duration-200 hover:border-primary/50 hover:bg-accent/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary border border-border p-1 shrink-0 overflow-hidden">
                  {item.tvgLogo ? (
                    <img src={item.tvgLogo} alt={item.channelName} className="h-full w-full object-cover" />
                  ) : (
                    <Tv className="h-4 w-4 text-foreground" />
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition">
                    {item.channelName}
                  </h3>
                  <p className="truncate text-[11px] text-muted-foreground font-mono">
                    {item.groupTitle} • {item.playlistName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {formatTimeAgo(item.lastWatchedAt)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayItem(item);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition"
                  title="Resume Watching"
                >
                  <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
