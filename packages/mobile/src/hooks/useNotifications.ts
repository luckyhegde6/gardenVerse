import { useEffect } from "react";
import { useNotificationStore } from "../stores/notificationStore";

export function useNotifications() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    subscribeToRealtime,
    unsubscribeFromRealtime,
  } = useNotificationStore();

  useEffect(() => {
    if (notifications.length === 0) {
      fetchNotifications();
    }
  }, [notifications.length, fetchNotifications]);

  useEffect(() => {
    subscribeToRealtime();
    return () => {
      unsubscribeFromRealtime();
    };
  }, [subscribeToRealtime, unsubscribeFromRealtime]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
