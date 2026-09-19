import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Plus, Layers, Sparkles, Globe, FileText } from 'lucide-react';
import { playlistApi } from '../api/playlists';
import { Playlist } from '../types';

interface PlaylistSwitcherProps {
  selectedPlaylistId?: number;
  onSelectPlaylist: (playlistId: number | undefined) => void;
  onOpenAddPlaylist: () => void;
}

export const PlaylistSwitcher: React.FC<PlaylistSwitcherProps> = ({
  selectedPlaylistId,
  onSelectPlaylist,
  onOpenAddPlaylist,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    playlistApi.getAll().then((data) => {
      if (Array.isArray(data)) {
        setPlaylists(data);
      }
    }).catch((err) => {
      console.warn('Failed to load playlists in switcher', err);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safePlaylists = Array.isArray(playlists) ? playlists : [];
  const currentPlaylist = safePlaylists.find((p) => p.id === selectedPlaylistId);
  const displayName = currentPlaylist ? currentPlaylist.name : 'All Playlists';

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-secondary border border-border hover:bg-accent px-3 py-1.5 text-xs font-medium text-foreground transition shadow-sm"
        title="Switch Playlist"
      >
        <Layers className="h-3.5 w-3.5 text-foreground" />
        <span className="truncate max-w-[140px] sm:max-w-[200px]">{displayName}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-64 rounded-lg bg-popover border border-border shadow-sm p-1.5 z-50 animate-scale-in text-popover-foreground">
          <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Select Playlist Feed
          </div>

          {/* All Playlists Option */}
          <button
            onClick={() => {
              onSelectPlaylist(undefined);
              setIsOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs transition ${
              selectedPlaylistId === undefined
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>All Playlists (Combined)</span>
            </div>
            {selectedPlaylistId === undefined && <Check className="h-3.5 w-3.5" />}
          </button>

          <div className="my-1 border-t border-border" />

          {/* Individual Playlists */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 no-scrollbar">
            {safePlaylists.map((pl) => {
              const isSelected = selectedPlaylistId === pl.id;
              return (
                <button
                  key={pl.id}
                  onClick={() => {
                    onSelectPlaylist(pl.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs transition ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'text-popover-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {pl.isUrl ? (
                      <Globe className="h-3.5 w-3.5 text-foreground shrink-0" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="truncate">{pl.name}</span>
                  </div>
                  <span className="text-[10px] opacity-75 font-mono ml-2 shrink-0">
                    {pl.channelCount}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="my-1 border-t border-border" />

          {/* Add New Playlist */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenAddPlaylist();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add New Playlist...</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PlaylistSwitcher;
