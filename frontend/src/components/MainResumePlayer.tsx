import React from 'react';
import { Play, Tv, X, Radio } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const MainResumePlayer: React.FC = () => {
  const { currentChannel, isPlayerOpen, openPlayer, clearCurrentChannel } = usePlayer();

  if (!currentChannel || isPlayerOpen) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-22 inset-x-4 sm:inset-x-auto sm:right-6 z-40 max-w-md animate-slide-up pointer-events-auto font-sans">
      <div className="flex items-center justify-between gap-3.5 rounded-lg bg-card/95 border border-border p-3 sm:p-3.5 shadow-sm backdrop-blur-2xl hover:border-muted-foreground/40 transition-all text-card-foreground">
        {/* Left: TV Logo & Channel Meta */}
        <div
          onClick={openPlayer}
          className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
        >
          <div className="relative h-10 w-10 rounded-md bg-background border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
            {currentChannel.tvgLogo ? (
              <img
                src={currentChannel.tvgLogo}
                alt={currentChannel.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Tv className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="absolute top-0.5 right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground font-bold uppercase tracking-wider">
              <Radio className="h-3 w-3 animate-pulse text-foreground" />
              <span>Active Feed</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-foreground truncate" title={currentChannel.name}>
              {currentChannel.name}
            </h4>
            <p className="text-[11px] text-muted-foreground truncate font-mono">
              {currentChannel.groupTitle || 'IPTV Stream'}
            </p>
          </div>
        </div>

        {/* Right: Resume Button & Dismiss */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openPlayer}
            className="flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition active:scale-95"
            title="Resume full playback"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Resume</span>
          </button>

          <button
            onClick={clearCurrentChannel}
            className="h-7 w-7 rounded-md bg-secondary hover:bg-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition"
            title="Dismiss mini player"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainResumePlayer;
