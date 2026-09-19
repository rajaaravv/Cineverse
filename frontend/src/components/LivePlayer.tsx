import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  ChevronDown,
  ArrowLeft,
  Star,
  RefreshCw,
  PictureInPicture,
  Tv,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  AlertCircle,
  Sparkles,
  ListVideo,
  X,
  Search,
  Scan,
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { favoriteApi } from '../api/favorites';
import { Channel } from '../types';

// Verified, high-reliability HLS sample streams for fallback
const VERIFIED_FALLBACK_STREAMS = [
  {
    name: 'Sintel 4K Cinematic (Akamai HLS)',
    url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
  },
  {
    name: 'Big Buck Bunny (Mux HLS)',
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  },
  {
    name: 'Tears of Steel (Unified HLS)',
    url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
  },
];

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const LivePlayer: React.FC = () => {
  const {
    currentChannel,
    isPlayerOpen,
    closePlayer,
    channelQueue,
    playChannel,
    toggleFavoriteState,
  } = usePlayer();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [streamStatus, setStreamStatus] = useState<'LOADING' | 'LIVE' | 'BUFFERING' | 'ERROR'>('LOADING');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showUnmutePrompt, setShowUnmutePrompt] = useState<boolean>(false);
  
  // Scrubber & time state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLiveStream, setIsLiveStream] = useState<boolean>(true);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showCenterIcon, setShowCenterIcon] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerSearch, setDrawerSearch] = useState<string>('');
  const [objectFitCover, setObjectFitCover] = useState<boolean>(false);

  // Auto-hide controls logic
  const resetIdleTimer = useCallback(() => {
    setShowControls(true);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (isPlaying && !isDrawerOpen) {
      idleTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [isPlaying, isDrawerOpen]);

  const handleMouseMove = () => {
    resetIdleTimer();
  };

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isPlaying, isDrawerOpen, resetIdleTimer]);

  // Initialize and attach HLS stream
  const initHlsStream = useCallback((overrideUrl?: string) => {
    if (!currentChannel || !videoRef.current) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;
    const streamUrl = overrideUrl || currentChannel.streamUrl;
    setStreamStatus('LOADING');
    setErrorMessage('');
    setShowUnmutePrompt(false);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        setStreamStatus('LIVE');
        setIsLiveStream(data.levels[0]?.details?.live ?? true);

        // Handle browser autoplay policy gracefully
        video.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('Autoplay unmuted was blocked by browser. Attempting muted playback:', err);
          video.muted = true;
          setIsMuted(true);
          setShowUnmutePrompt(true);
          video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error('Fatal HLS error:', data.type, data.details);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setStreamStatus('ERROR');
            setErrorMessage(`Stream offline or CORS restricted (${data.details})`);
            hls.destroy();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.play().then(() => setIsPlaying(true)).catch(() => {
        video.muted = true;
        setIsMuted(true);
        setShowUnmutePrompt(true);
        video.play().catch(() => setIsPlaying(false));
      });
    }
  }, [currentChannel]);

  useEffect(() => {
    if (isPlayerOpen && currentChannel) {
      initHlsStream();
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentChannel, isPlayerOpen, initHlsStream]);

  // Video event listeners for accurate timeline & live status
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.duration && isFinite(video.duration)) {
        setDuration(video.duration);
        setIsLiveStream(false);
      } else {
        setIsLiveStream(true);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setStreamStatus('BUFFERING');
    const onPlaying = () => setStreamStatus('LIVE');

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    if (!isPlayerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in input
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        skipTime(-10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        skipTime(10);
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setIsDrawerOpen((prev) => !prev);
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (isDrawerOpen) {
          setIsDrawerOpen(false);
        } else if (isFullscreen) {
          document.exitFullscreen?.();
          setIsFullscreen(false);
        } else {
          closePlayer();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayerOpen, isFullscreen, isPlaying, isMuted, volume, isDrawerOpen]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    setShowCenterIcon(true);
    setTimeout(() => setShowCenterIcon(false), 700);

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    videoRef.current.muted = next;
    setShowUnmutePrompt(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      const muted = val === 0;
      setIsMuted(muted);
      videoRef.current.muted = muted;
    }
  };

  const unmuteFromPrompt = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
      setShowUnmutePrompt(false);
    }
  };

  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || !videoRef.current || isLiveStream || duration <= 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = percentage * duration;
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn('Fullscreen request failed', e);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP not available', e);
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentChannel) return;
    try {
      if (currentChannel.favorite) {
        await favoriteApi.remove(currentChannel.id);
        toggleFavoriteState(currentChannel.id, false);
      } else {
        await favoriteApi.add(currentChannel.id);
        toggleFavoriteState(currentChannel.id, true);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  // Next / Previous channel in queue
  const currentIdx = channelQueue.findIndex((c) => c.id === currentChannel?.id);
  const handlePrevChannel = () => {
    if (channelQueue.length === 0) return;
    const nextIdx = currentIdx <= 0 ? channelQueue.length - 1 : currentIdx - 1;
    playChannel(channelQueue[nextIdx], channelQueue);
  };

  const handleNextChannel = () => {
    if (channelQueue.length === 0) return;
    const nextIdx = currentIdx >= channelQueue.length - 1 ? 0 : currentIdx + 1;
    playChannel(channelQueue[nextIdx], channelQueue);
  };

  if (!isPlayerOpen || !currentChannel) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const filteredQueue = channelQueue.filter((c) =>
    c.name.toLowerCase().includes(drawerSearch.toLowerCase()) ||
    (c.groupTitle && c.groupTitle.toLowerCase().includes(drawerSearch.toLowerCase()))
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-background flex flex-col justify-between overflow-hidden select-none font-sans"
    >
      {/* 100% Viewport Video Element */}
      <video
        ref={videoRef}
        playsInline
        onClick={togglePlay}
        className={`absolute inset-0 h-full w-full bg-background cursor-pointer transition-all ${
          objectFitCover ? 'object-cover' : 'object-contain'
        }`}
      />

      {/* Center Animated Play/Pause Feedback */}
      {showCenterIcon && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-30 transition-opacity">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-popover/90 border border-border text-popover-foreground shadow-sm animate-scale-in">
            {isPlaying ? <Play className="h-10 w-10 fill-current ml-1" /> : <Pause className="h-10 w-10 fill-current" />}
          </div>
        </div>
      )}

      {/* Tap to Unmute Notification Pill */}
      {showUnmutePrompt && (
        <div className="absolute top-20 inset-x-0 flex justify-center z-35">
          <button
            onClick={unmuteFromPrompt}
            className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-sm hover:bg-primary/90 transition"
          >
            <VolumeX className="h-4 w-4" />
            <span>Tap to Unmute Audio</span>
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {streamStatus === 'LOADING' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs z-20">
          <RefreshCw className="h-9 w-9 animate-spin text-primary" />
          <span className="mt-3 text-xs font-mono tracking-wider text-muted-foreground">
            BUFFERING LIVE STREAM...
          </span>
        </div>
      )}

      {/* Stream Error & Fallback Panel */}
      {streamStatus === 'ERROR' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 p-6 text-center z-20">
          <div className="h-12 w-12 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive mb-3">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Live Feed Unavailable</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            {errorMessage || 'This stream cannot be played due to network restrictions or CORS.'}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => initHlsStream()}
              className="flex items-center gap-1.5 rounded-lg bg-secondary border border-border hover:bg-accent px-3.5 py-1.5 text-xs font-medium text-secondary-foreground transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Stream</span>
            </button>

            <button
              onClick={() => initHlsStream(VERIFIED_FALLBACK_STREAMS[0].url)}
              className="flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Play High-Speed Demo Stream</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Floating Control Bar (Auto-Hides) */}
      <div
        className={`relative z-30 p-4 sm:p-5 flex items-center justify-between bg-gradient-to-b from-background via-background/60 to-transparent transition-opacity duration-300 ${
          showControls || !isPlaying || isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={closePlayer}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-secondary hover:bg-accent border border-border text-secondary-foreground hover:text-foreground transition active:scale-95 shadow-sm group"
            title="Back to Channels (Esc)"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform text-foreground" />
            <span className="text-xs font-semibold">Back</span>
          </button>

          <div className="flex items-center gap-2.5">
            {currentChannel.tvgLogo && (
              <img
                src={currentChannel.tvgLogo}
                alt={currentChannel.name}
                className="h-8 w-8 rounded object-contain bg-background border border-border"
              />
            )}
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-foreground truncate max-w-[220px] sm:max-w-[450px]">
                {currentChannel.name}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                <span className="text-foreground font-medium">{currentChannel.groupTitle || 'IPTV'}</span>
                <span>•</span>
                <span>{currentChannel.playlistName || 'Live'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Live Indicator Chip */}
          <div className="flex items-center gap-1.5 rounded-md bg-background border border-border px-2.5 py-1 text-[11px] font-mono font-medium">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-foreground font-bold">LIVE</span>
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition shadow-sm ${
              currentChannel.favorite
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary hover:bg-accent border-border text-muted-foreground hover:text-foreground'
            }`}
            title={currentChannel.favorite ? 'Remove Favorite' : 'Save to Favorites'}
          >
            <Star className={`h-4 w-4 ${currentChannel.favorite ? 'fill-current' : ''}`} />
          </button>

          {/* Channels Drawer Toggle */}
          <button
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-semibold transition shadow-sm ${
              isDrawerOpen
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-secondary hover:bg-accent border-border text-secondary-foreground'
            }`}
            title="Toggle Channels Drawer (C)"
          >
            <ListVideo className="h-4 w-4" />
            <span className="hidden sm:inline">Channels</span>
            <span className="text-[11px] opacity-80">({channelQueue.length})</span>
          </button>

          {/* Direct Close Button */}
          <button
            onClick={closePlayer}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary hover:bg-destructive/20 hover:border-destructive/30 hover:text-destructive border border-border text-muted-foreground transition active:scale-95 shadow-sm"
            title="Close Player"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Cinema Control Bar (Auto-Hides) */}
      <div
        className={`relative z-30 p-4 sm:p-6 bg-gradient-to-t from-background via-background/80 to-transparent transition-opacity duration-300 ${
          showControls || !isPlaying || isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber Progress Bar */}
        <div
          ref={scrubberRef}
          onClick={handleScrubberClick}
          className={`group/scrub relative mb-3.5 h-1.5 w-full rounded-full bg-muted transition-all hover:h-2.5 ${
            isLiveStream ? 'cursor-default' : 'cursor-pointer'
          }`}
        >
          {/* Played Fill */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-primary rounded-full transition-all"
            style={{ width: isLiveStream ? '100%' : `${progressPercent}%` }}
          />
          {/* Scrubber Thumb */}
          {!isLiveStream && (
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-primary shadow-sm transition-transform scale-0 group-hover/scrub:scale-100"
              style={{ left: `calc(${progressPercent}% - 7px)` }}
            />
          )}
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-xs font-mono">
          {/* Left Controls: Play, Skips, Queue Prev/Next, Volume, Time */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition shadow-sm"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
            </button>

            {/* Prev Channel in Queue */}
            <button
              onClick={handlePrevChannel}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition"
              title="Previous Channel"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>

            {/* Rewind 10s */}
            <button
              onClick={() => skipTime(-10)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition"
              title="Rewind 10s (←)"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            {/* Forward 10s */}
            <button
              onClick={() => skipTime(10)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition"
              title="Forward 10s (→)"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>

            {/* Next Channel in Queue */}
            <button
              onClick={handleNextChannel}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition"
              title="Next Channel"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>

            {/* Volume Slider Group */}
            <div className="group/vol relative flex items-center gap-1.5 ml-1">
              <button
                onClick={toggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-3.5 w-3.5 text-destructive" />
                ) : volume < 0.5 ? (
                  <Volume1 className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1 accent-foreground bg-muted rounded-full cursor-pointer opacity-80 group-hover/vol:opacity-100"
                title="Adjust Volume"
              />
            </div>

            {/* Time Display */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pl-1">
              <span className="text-foreground font-semibold">{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{isLiveStream ? 'LIVE' : formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Tools: Fit/Fill, PiP, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Aspect Ratio Mode (Contain vs Cover) */}
            <button
              onClick={() => setObjectFitCover((prev) => !prev)}
              className={`flex h-8 px-2.5 items-center gap-1.5 rounded-lg border text-[11px] transition ${
                objectFitCover
                  ? 'bg-primary text-primary-foreground border-primary font-semibold'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              title="Toggle Fit / Fill"
            >
              <Scan className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{objectFitCover ? 'Fill' : 'Fit'}</span>
            </button>

            {/* PiP */}
            <button
              onClick={togglePiP}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition"
              title="Picture-in-Picture"
            >
              <PictureInPicture className="h-3.5 w-3.5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over Right Channel Queue Drawer */}
      {isDrawerOpen && (
        <div className="fixed top-0 bottom-0 right-0 w-80 sm:w-96 bg-popover border-l border-border z-40 flex flex-col shadow-sm animate-fade-in text-popover-foreground">
          {/* Drawer Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListVideo className="h-4 w-4 text-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Playlist Channels</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-mono">
                {channelQueue.length}
              </span>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="h-7 w-7 rounded-lg bg-secondary hover:bg-accent border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Channel Search */}
          <div className="p-3 border-b border-border">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search channel..."
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring focus:border-input focus:outline-none"
              />
            </div>
          </div>

          {/* Drawer Channels List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredQueue.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground font-mono">
                No channels found
              </div>
            ) : (
              filteredQueue.map((ch) => {
                const isActive = ch.id === currentChannel.id;
                return (
                  <div
                    key={ch.id}
                    onClick={() => {
                      playChannel(ch, channelQueue);
                      setIsDrawerOpen(false);
                    }}
                    className={`group cursor-pointer rounded-lg border p-2.5 flex items-center gap-3 transition ${
                      isActive
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-card border-border hover:border-muted-foreground/40 hover:bg-accent text-card-foreground'
                    }`}
                  >
                    <div className="h-9 w-9 rounded-md bg-background border border-border flex items-center justify-center shrink-0 overflow-hidden">
                      {ch.tvgLogo ? (
                        <img src={ch.tvgLogo} alt={ch.name} className="h-full w-full object-cover" />
                      ) : (
                        <Tv className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-xs font-medium truncate ${isActive ? 'text-foreground font-bold' : 'text-foreground'}`}>
                          {ch.name}
                        </h4>
                        {isActive && (
                          <span className="shrink-0 flex h-1.5 w-1.5 rounded-full bg-primary shadow-sm" />
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate block font-mono">
                        {ch.groupTitle || 'IPTV Channel'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePlayer;
