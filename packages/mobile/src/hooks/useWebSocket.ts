import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/websocket';
import { useAuthStore } from '../stores/authStore';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      socketService.disconnect();
      setIsConnected(false);
      return;
    }

    socketService.connect();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const socket = (socketService as any).socket;
    socket?.on('connect', onConnect);
    socket?.on('disconnect', onDisconnect);

    return () => {
      socket?.off('connect', onConnect);
      socket?.off('disconnect', onDisconnect);
    };
  }, [isAuthenticated]);

  const joinGarden = useCallback((gardenId: string) => {
    socketService.joinGarden(gardenId);
  }, []);

  const leaveGarden = useCallback((gardenId: string) => {
    socketService.leaveGarden(gardenId);
  }, []);

  return {
    isConnected,
    socketService,
    joinGarden,
    leaveGarden,
  };
}
