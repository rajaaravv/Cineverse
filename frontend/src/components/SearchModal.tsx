import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Tv, Play } from 'lucide-react';
import { channelApi } from '../api/channels';
import { Channel } from '../types';
import { usePlayer } from '../context/PlayerContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { playChannel } = usePlayer();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      channelApi.getChannels({ page: 0, size: 12 }).then((res) => {
        if (res && Array.isArray(res.content)) {
          setResults(res.content);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (!query.trim()) {
      channelApi.getChannels({ page: 0, size: 12 }).then((res) => {
        if (res && Array.isArray(res.content)) {
          setResults(res.content);
        }
      }).catch(console.error);
      return;
    }

    const handler = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await channelApi.searchChannels(query.trim(), { page: 0, size: 24 });
        if (res && Array.isArray(res.content)) {
          setResults(res.content);
        }
      } catch (e) {
        console.error('Search failed', e);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(handler);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const safeResults = Array.isArray(results) ? results : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 animate-fade-in font-sans">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-lg bg-popover border border-border shadow-sm z-10 overflow-hidden flex flex-col max-h-[80vh] text-popover-foreground">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-border flex items-center gap-3 bg-background">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search channels, sports, news, movies, series..."
            className="flex-1 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-secondary hover:bg-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 font-mono">
            <span>{query ? `Search Results for "${query}"` : 'Trending & Quick Picks'}</span>
            <span>{safeResults.length} found</span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground font-mono">
              Searching live channels...
            </div>
          ) : safeResults.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No channels matched your search query. Try another keyword.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {safeResults.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => {
                    playChannel(ch, safeResults);
                    onClose();
                  }}
                  className="group cursor-pointer rounded-lg border border-border bg-card p-3 flex items-center gap-3 transition hover:border-muted-foreground/40 hover:bg-accent"
                >
                  <div className="h-10 w-10 rounded-md bg-background border border-border flex items-center justify-center shrink-0 overflow-hidden">
                    {ch.tvgLogo ? (
                      <img src={ch.tvgLogo} alt={ch.name} className="h-full w-full object-cover" />
                    ) : (
                      <Tv className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-semibold text-card-foreground truncate group-hover:text-primary transition">
                      {ch.name}
                    </h4>
                    <span className="text-[10px] text-muted-foreground truncate block font-mono">
                      {ch.groupTitle || 'Stream'} • {ch.playlistName || 'Live'}
                    </span>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary group-hover:bg-primary group-hover:text-primary-foreground text-foreground transition shrink-0">
                    <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
