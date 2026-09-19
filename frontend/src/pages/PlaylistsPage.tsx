import React, { useEffect, useState } from 'react';
import { playlistApi } from '../api/playlists';
import { Playlist } from '../types';
import { ListFilter, Plus, RefreshCw, Trash2, Edit2, Globe, FileText, Calendar, Tv, Check, X } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface PlaylistsPageProps {
  onOpenAddPlaylist: () => void;
}

export const PlaylistsPage: React.FC<PlaylistsPageProps> = ({ onOpenAddPlaylist }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const loadPlaylists = async () => {
    setIsLoading(true);
    try {
      const data = await playlistApi.getAll();
      setPlaylists(data);
    } catch (err) {
      console.error('Failed to load playlists', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, []);

  const handleRefresh = async (id: number) => {
    setRefreshingId(id);
    setActionError(null);
    try {
      const updated = await playlistApi.refresh(id);
      setPlaylists((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to refresh playlist');
    } finally {
      setRefreshingId(null);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete playlist "${name}" and all its channels?`)) {
      return;
    }
    setActionError(null);
    try {
      await playlistApi.delete(id);
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to delete playlist');
    }
  };

  const startEdit = (p: Playlist) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const handleSaveRename = async (id: number) => {
    if (!editName.trim()) return;
    try {
      const updated = await playlistApi.rename(id, editName.trim());
      setPlaylists((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to rename playlist');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading Cineverse playlists..." />;
  }

  return (
    <div className="space-y-6 pb-24 font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">M3U Playlists</h1>
          <p className="text-xs text-muted-foreground">
            Manage your imported IPTV sources, refresh channels, and organize your streams
          </p>
        </div>

        <button
          onClick={onOpenAddPlaylist}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Import Playlist</span>
        </button>
      </div>

      {actionError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {actionError}
        </div>
      )}

      {playlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary border border-border text-foreground">
            <ListFilter className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">No playlists imported yet</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Import an M3U playlist by URL or file upload to start streaming live channels.
          </p>
          <button
            onClick={onOpenAddPlaylist}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Your First Playlist</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {playlists.map((playlist) => {
            const isEditing = editingId === playlist.id;
            const isRefreshing = refreshingId === playlist.id;

            return (
              <div
                key={playlist.id}
                className="flex flex-col justify-between rounded-lg border border-border bg-card p-5 transition hover:border-primary/50 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary border border-border text-foreground shrink-0">
                        {playlist.isUrl ? <Globe className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="rounded-md border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveRename(playlist.id)}
                              className="rounded p-1 text-foreground hover:bg-accent"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded p-1 text-muted-foreground hover:bg-accent"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h3 className="truncate font-semibold text-foreground text-sm" title={playlist.name}>
                              {playlist.name}
                            </h3>
                            <button
                              onClick={() => startEdit(playlist)}
                              className="text-muted-foreground hover:text-foreground"
                              title="Rename"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {playlist.isUrl ? 'M3U URL Feed' : 'Uploaded File'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(playlist.id, playlist.name)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-transparent transition"
                      title="Delete playlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {playlist.sourceUrl && (
                    <p className="mt-3 truncate rounded-lg bg-secondary p-2 text-[11px] font-mono text-muted-foreground border border-border" title={playlist.sourceUrl}>
                      {playlist.sourceUrl}
                    </p>
                  )}
                </div>

                <div className="mt-5 border-t border-border pt-3.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Tv className="h-3.5 w-3.5 text-foreground" />
                      <span className="font-semibold text-foreground font-mono">{playlist.channelCount}</span> channels
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(playlist.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {playlist.isUrl && (
                    <button
                      onClick={() => handleRefresh(playlist.id)}
                      disabled={isRefreshing}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-secondary border border-border py-2 text-xs font-semibold text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-foreground' : ''}`} />
                      <span>{isRefreshing ? 'Refreshing Channels...' : 'Refresh Source'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
