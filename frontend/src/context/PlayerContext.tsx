import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Channel } from '../types';
import { historyApi } from '../api/history';

interface PlayerContextType {
  currentChannel: Channel | null;
  channelQueue: Channel[];
  playChannel: (channel: Channel, queue?: Channel[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  isPlayerOpen: boolean;
  openPlayer: () => void;
  closePlayer: () => void;
  clearCurrentChannel: () => void;
  toggleFavoriteState: (channelId: number, isFav: boolean) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(() => {
    try {
      const saved = localStorage.getItem('cineverse_last_channel');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed?.playlistName === 'Curated Cinema & News' ||
          parsed?.playlistName === 'World Sports & Live TV' ||
          parsed?.name === 'Scream VII - The Horror Movie Channel'
        ) {
          localStorage.removeItem('cineverse_last_channel');
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [channelQueue, setChannelQueue] = useState<Channel[]>([]);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);
  const isClosingFromPopstate = React.useRef(false);

  // Sync browser back button / gestures with player overlay
  React.useEffect(() => {
    const handlePopState = () => {
      isClosingFromPopstate.current = true;
      setIsPlayerOpen(false);
      setTimeout(() => {
        isClosingFromPopstate.current = false;
      }, 50);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const playChannel = (channel: Channel, queue?: Channel[]) => {
    setCurrentChannel(channel);
    if (!isPlayerOpen) {
      window.history.pushState({ cineversePlayer: true }, '', window.location.href);
    }
    setIsPlayerOpen(true);
    try {
      localStorage.setItem('cineverse_last_channel', JSON.stringify(channel));
    } catch {}

    if (queue && queue.length > 0) {
      setChannelQueue(queue);
    }
    // Record in watch history
    historyApi.record(channel.id, channel).catch((err) => {
      console.warn('Failed to record history', err);
    });
  };

  const playNext = () => {
    if (!currentChannel || channelQueue.length === 0) return;
    const currentIndex = channelQueue.findIndex((c) => c.id === currentChannel.id);
    if (currentIndex !== -1 && currentIndex < channelQueue.length - 1) {
      playChannel(channelQueue[currentIndex + 1], channelQueue);
    } else if (channelQueue.length > 0) {
      // Loop to first channel
      playChannel(channelQueue[0], channelQueue);
    }
  };

  const playPrevious = () => {
    if (!currentChannel || channelQueue.length === 0) return;
    const currentIndex = channelQueue.findIndex((c) => c.id === currentChannel.id);
    if (currentIndex > 0) {
      playChannel(channelQueue[currentIndex - 1], channelQueue);
    } else if (channelQueue.length > 0) {
      // Loop to last channel
      playChannel(channelQueue[channelQueue.length - 1], channelQueue);
    }
  };

  const openPlayer = () => {
    if (currentChannel) {
      if (!isPlayerOpen) {
        window.history.pushState({ cineversePlayer: true }, '', window.location.href);
      }
      setIsPlayerOpen(true);
    }
  };

  const closePlayer = () => {
    setIsPlayerOpen(false);
    if (!isClosingFromPopstate.current && window.history.state?.cineversePlayer) {
      window.history.back();
    }
  };

  const clearCurrentChannel = () => {
    setCurrentChannel(null);
    closePlayer();
    try {
      localStorage.removeItem('cineverse_last_channel');
    } catch {}
  };

  const toggleFavoriteState = (channelId: number, isFav: boolean) => {
    if (currentChannel && currentChannel.id === channelId) {
      const updated = { ...currentChannel, favorite: isFav };
      setCurrentChannel(updated);
      localStorage.setItem('cineverse_last_channel', JSON.stringify(updated));
    }
    setChannelQueue((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, favorite: isFav } : c))
    );
  };

  return (
    <PlayerContext.Provider
      value={{
        currentChannel,
        channelQueue,
        playChannel,
        playNext,
        playPrevious,
        isPlayerOpen,
        openPlayer,
        closePlayer,
        clearCurrentChannel,
        toggleFavoriteState,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
