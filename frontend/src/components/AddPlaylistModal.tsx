import React, { useState } from 'react';
import { X, Globe, Upload, FileText, Loader2 } from 'lucide-react';
import { playlistApi } from '../api/playlists';
import { Playlist } from '../types';

interface AddPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistAdded: (playlist: Playlist) => void;
}

export const AddPlaylistModal: React.FC<AddPlaylistModalProps> = ({
  isOpen,
  onClose,
  onPlaylistAdded,
}) => {
  const [activeTab, setActiveTab] = useState<'URL' | 'FILE' | 'TEXT'>('URL');
  const [name, setName] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let createdPlaylist: Playlist;

      if (activeTab === 'URL') {
        if (!name.trim()) throw new Error('Please enter a playlist name');
        if (!url.trim()) throw new Error('Please enter an M3U playlist URL');

        createdPlaylist = await playlistApi.createFromUrlOrText({
          name: name.trim(),
          url: url.trim(),
        });
      } else if (activeTab === 'TEXT') {
        if (!name.trim()) throw new Error('Please enter a playlist name');
        if (!rawText.trim()) throw new Error('Please paste your M3U content');

        createdPlaylist = await playlistApi.createFromUrlOrText({
          name: name.trim(),
          content: rawText.trim(),
        });
      } else {
        if (!file) throw new Error('Please select an M3U file to upload');

        createdPlaylist = await playlistApi.uploadFile(name.trim() || file.name, file);
      }

      onPlaylistAdded(createdPlaylist);
      onClose();
      setName('');
      setUrl('');
      setRawText('');
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to import playlist');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-lg bg-card p-6 sm:p-7 shadow-sm border border-border z-10 text-card-foreground">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-card-foreground">Import M3U Playlist</h2>
            <p className="text-xs text-muted-foreground">Add channels from your IPTV provider, M3U URL, paste content, or upload file</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground bg-secondary border border-border">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="mt-5 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 border border-border">
          <button
            type="button"
            onClick={() => setActiveTab('URL')}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-all ${
              activeTab === 'URL' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>M3U URL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TEXT')}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-all ${
              activeTab === 'TEXT' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Paste M3U</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FILE')}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-all ${
              activeTab === 'FILE' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>File Upload</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground">Playlist Name</label>
            <input
              type="text"
              placeholder="e.g., My Favorite TV & Sports"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-input focus:outline-none transition"
            />
          </div>

          {activeTab === 'URL' && (
            <div>
              <label className="block text-xs font-medium text-foreground">M3U / M3U8 URL</label>
              <input
                type="url"
                required
                placeholder="https://example.com/playlist.m3u"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-input focus:outline-none transition"
              />
            </div>
          )}

          {activeTab === 'TEXT' && (
            <div>
              <label className="block text-xs font-medium text-foreground">Paste M3U Text Content</label>
              <textarea
                required
                rows={4}
                placeholder={`#EXTM3U\n#EXTINF:-1 tvg-logo="https://..." group-title="News",CNN Live\nhttps://example.com/stream.m3u8`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-input focus:outline-none transition"
              />
            </div>
          )}

          {activeTab === 'FILE' && (
            <div>
              <label className="block text-xs font-medium text-foreground">Select M3U File</label>
              <input
                type="file"
                accept=".m3u,.m3u8,text/plain"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-xs file:font-medium file:text-foreground hover:file:bg-accent"
              />
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-secondary border border-border px-4 py-2 text-xs font-medium text-secondary-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isSubmitting ? 'Importing...' : 'Import Playlist'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
