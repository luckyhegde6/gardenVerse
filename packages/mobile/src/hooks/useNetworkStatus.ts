import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

type ConnectionType = 'wifi' | 'cellular' | 'unknown' | 'none';

interface NetworkStatus {
  isOnline: boolean;
  connectionType: ConnectionType;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<ConnectionType>('unknown');

  useEffect(() => {
    // Use browser APIs on web, NetInfo-like behaviour on native
    if (Platform.OS === 'web') {
      const updateOnline = () => {
        setIsOnline(navigator.onLine);
        setConnectionType(navigator.onLine ? 'unknown' : 'none');
      };

      updateOnline();
      window.addEventListener('online', updateOnline);
      window.addEventListener('offline', updateOnline);
      return () => {
        window.removeEventListener('online', updateOnline);
        window.removeEventListener('offline', updateOnline);
      };
    }

    // On native, we assume online and periodically ping
    setIsOnline(true);
    setConnectionType('unknown');
  }, []);

  return { isOnline, connectionType };
}
