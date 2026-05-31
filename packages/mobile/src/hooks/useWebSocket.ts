export interface UseWebSocketReturn {
  isConnected: boolean;
  socketService: any;
  joinGarden: (gardenId: string) => void;
  leaveGarden: (gardenId: string) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  return {
    isConnected: false,
    socketService: null,
    joinGarden: () => {},
    leaveGarden: () => {},
  };
}
