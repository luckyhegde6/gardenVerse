import { create } from "zustand";
import api from "../services/api";
import { Notification } from "../types";
import socketService from "../services/websocket";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Notification[]>("/notifications");
      const notifications = response.data;
      set({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch notifications",
        isLoading: false,
      });
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      set((state) => {
        const notifications = state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n,
        );
        return {
          notifications,
          unreadCount: notifications.filter((n) => !n.isRead).length,
        };
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to mark as read",
      });
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch("/notifications/read-all");
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
        })),
        unreadCount: 0,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to mark all as read",
      });
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  subscribeToRealtime: () => {
    socketService.on("notification:new", (notification) => {
      get().addNotification(notification);
    });
  },

  unsubscribeFromRealtime: () => {
    socketService.off("notification:new", () => {});
  },
}));
