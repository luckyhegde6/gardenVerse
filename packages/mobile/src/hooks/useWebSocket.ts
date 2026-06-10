import socketService from "../services/websocket";

export interface UseWebSocketReturn {
  isConnected: boolean;
  socketService: typeof socketService;
  joinGarden: (gardenId: string) => void;
  leaveGarden: (gardenId: string) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  // WebSocket connection is not available yet — the backend was migrated from
  // NestJS (port 3001) to Next.js API routes which don't support Socket.IO.
  // The socketService is exported so consumers can reference it when the
  // transport layer is replaced (e.g., Server-Sent Events or a dedicated WS host).
  return {
    isConnected: false,
    socketService,
    joinGarden: () => {},
    leaveGarden: () => {},
  };
}
