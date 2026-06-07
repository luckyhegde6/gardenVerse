import { io, Socket } from "socket.io-client";
import { getItem, StorageKeys } from "../utils/storage";
import {
  Crop,
  Notification,
  Message,
  WeatherData,
  GovernmentAdvisory,
} from "../types";

const WS_URL =
  process.env.WS_URL || (__DEV__
    ? "http://localhost:3001"
    : "wss://ws.gardenverse.app");

export interface ServerToClientEvents {
  "garden:update": (data: { gardenId: string; crops: Crop[] }) => void;
  "crop:growth": (data: { cropId: string; growthStage: number }) => void;
  "notification:new": (notification: Notification) => void;
  "weather:alert": (alert: { type: string; message: string }) => void;
  "weather:update": (data: WeatherData) => void;
  "chat:message": (message: Message) => void;
  "chat:typing": (data: { userId: string; groupId: string }) => void;
  "advisory:new": (advisory: GovernmentAdvisory) => void;
  "user:online": (data: { userId: string }) => void;
  "user:offline": (data: { userId: string }) => void;
}

export interface ClientToServerEvents {
  "chat:send": (data: {
    content: string;
    groupId?: string;
    receiverId?: string;
  }) => void;
  "chat:typing": (data: { groupId: string; isTyping: boolean }) => void;
  "chat:join": (data: { groupId: string }) => void;
  "chat:leave": (data: { groupId: string }) => void;
  "garden:water": (data: { cropId: string }) => void;
  "garden:fertilize": (data: { cropId: string }) => void;
  "garden:harvest": (data: { cropId: string }) => void;
  "garden:join": (data: { gardenId: string }) => void;
  "garden:leave": (data: { gardenId: string }) => void;
}

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
    null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) return;

    const token = await getItem(StorageKeys.ACCESS_TOKEN);
    if (!token) return;

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    this.socket.on("connect", () => {
      if (__DEV__) console.log("[WS] Connected");
    });

    this.socket.on("disconnect", (reason) => {
      if (__DEV__) console.log("[WS] Disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      if (__DEV__) console.error("[WS] Connection error:", error.message);
    });

    this.socket.io.on("reconnect", (attempt: number) => {
      if (__DEV__) console.log("[WS] Reconnected after", attempt, "attempts");
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  on<E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E],
  ): void {
    this.socket?.on(event, handler as any);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as (...args: any[]) => void);
  }

  off<E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E],
  ): void {
    this.socket?.off(event, handler as any);
    this.listeners.get(event)?.delete(handler as (...args: any[]) => void);
  }

  emit<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ): void {
    this.socket?.emit(event, ...args);
  }

  joinGarden(gardenId: string): void {
    this.socket?.emit("garden:join", { gardenId });
  }

  leaveGarden(gardenId: string): void {
    this.socket?.emit("garden:leave", { gardenId });
  }

  joinChat(groupId: string): void {
    this.socket?.emit("chat:join", { groupId });
  }

  leaveChat(groupId: string): void {
    this.socket?.emit("chat:leave", { groupId });
  }
}

export const socketService = new SocketService();
export default socketService;
