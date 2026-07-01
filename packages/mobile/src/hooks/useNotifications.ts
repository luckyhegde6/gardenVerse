import { useEffect } from "react";
import {
  registerForPushNotifications,
  setupNotificationHandlers,
  notifyGrowthReady,
  notifyDailyReward,
  notifyStreakReminder,
} from "@services/notifications";
import { useAuthStore } from "@stores/authStore";
import { useRouter } from "expo-router";

export function useNotifications() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;

    const init = async () => {
      await registerForPushNotifications();
      try {
        const resp = await fetch(
          `${process.env.API_URL || "https://gardenverse.vercel.app"}/api/v1/notifications/preferences`,
        );
        if (resp.ok) {
          await resp.json();
        }
      } catch (e) {
        console.error("Failed to fetch notification preferences", e);
      }
    };
    init();

    const cleanup = setupNotificationHandlers(
      () => {},
      (response) => {
        const data = response.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
        if (data?.type === "growth_ready" && data?.cropId) {
          router.push({
            pathname: "/crop-detail/[cropId]",
            params: { cropId: data.cropId as string },
          });
        }
      },
    );
    return cleanup;
  }, [isAuthenticated]);
}

export function useGrowthAlerts(cropId: string, readyAt: Date) {
  useEffect(() => {
    const now = new Date();
    const diff = readyAt.getTime() - now.getTime();
    if (diff > 0) {
      const timer = setTimeout(() => {
        notifyGrowthReady("Crop", cropId);
      }, diff);
      return () => clearTimeout(timer);
    }
  }, [cropId, readyAt]);
}

export function useReminderNotifications() {
  useEffect(() => {
    const now = new Date();

    const nextReward = new Date();
    nextReward.setHours(9, 0, 0, 0);
    if (now > nextReward) nextReward.setDate(nextReward.getDate() + 1);
    const rewardTimer = setTimeout(() => {
      notifyDailyReward();
    }, nextReward.getTime() - now.getTime());

    const nextStreak = new Date();
    nextStreak.setHours(20, 0, 0, 0);
    if (now > nextStreak) nextStreak.setDate(nextStreak.getDate() + 1);
    const streakTimer = setTimeout(() => {
      notifyStreakReminder();
    }, nextStreak.getTime() - now.getTime());

    return () => {
      clearTimeout(rewardTimer);
      clearTimeout(streakTimer);
    };
  }, []);
}
