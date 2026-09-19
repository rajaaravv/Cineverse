import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { channelApi } from '../api/channels';
import { usePlayer } from '../context/PlayerContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const WatchPage: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const { playChannel } = usePlayer();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadAndPlay = async () => {
      if (!channelId) return;
      try {
        const id = parseInt(channelId, 10);
        const channel = await channelApi.getById(id);
        playChannel(channel);
        navigate('/channels', { replace: true });
      } catch (err) {
        console.error('Failed to load channel for watching', err);
        navigate('/channels', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    loadAndPlay();
  }, [channelId, playChannel, navigate]);

  if (isLoading) {
    return <LoadingSpinner message="Starting live channel stream..." />;
  }

  return null;
};
