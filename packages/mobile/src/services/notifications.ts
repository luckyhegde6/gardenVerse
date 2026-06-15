import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Push Token Registration ──────────────────────────────────────────────

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") {
    console.log("Push notifications are not supported on web");
    return null;
  }
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Failed to get push token permission!");
      return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    await SecureStore.setItemAsync("expoPushToken", token);
    await registerTokenWithBackend(token);
    return token;
  } catch (e) {
    console.error("Error registering for push notifications", e);
    return null;
  }
}

async function registerTokenWithBackend(token: string) {
  try {
    const devBaseUrl = Platform.OS === 'android'
      ? 'http://10.0.2.2:3000'
      : 'http://localhost:3000';
    const baseUrl =
      process.env.API_URL ||
      (__DEV__ ? devBaseUrl : 'https://gardenverse.vercel.app');
    await fetch(
      `${baseUrl}/api/v1/notifications/register-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, platform: Platform.OS }),
      },
    );
  } catch (e) {
    console.error("Failed to register push token with backend", e);
  }
}

// ─── Notification Handlers ─────────────────────────────────────────────────

export function setupNotificationHandlers(
  onForeground: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void,
) {
  const foregroundSub = Notifications.addNotificationReceivedListener(onForeground);
  const responseSub = Notifications.addNotificationResponseReceivedListener(onResponse);
  return () => {
    foregroundSub.remove();
    responseSub.remove();
  };
}

// ─── Local Notifications ──────────────────────────────────────────────────

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
  channelId?: string,
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
      ...(channelId && Platform.OS === "android" ? { channelId } : {}),
    },
    trigger: null,
  });
}

// ─── Convenience Senders ──────────────────────────────────────────────────

export async function notifyGrowthReady(cropName: string, cropId: string) {
  await sendLocalNotification(
    `${cropName} is ready to harvest!`,
    `Your ${cropName} has reached maturity. Tap to harvest.`,
    { type: "growth_ready", cropId },
    "growth",
  );
}

export async function notifyWaterReminder(cropNames: string[], count: number) {
  const names =
    count <= 2 ? cropNames.join(" and ") : `${cropNames[0]} and ${count - 1} others`;
  await sendLocalNotification(
    "Crops need water!",
    `${names} ${count === 1 ? "needs" : "need"} watering.`,
    { type: "water_reminder", cropNames },
    "growth",
  );
}

export async function notifyDailyReward() {
  await sendLocalNotification(
    "Daily reward available",
    "Collect your daily reward now!",
    { type: "daily_reward" },
    "default",
  );
}

export async function notifyStreakReminder() {
  await sendLocalNotification(
    "Keep your streak alive!",
    "Visit the app today to maintain your streak.",
    { type: "streak_reminder" },
    "default",
  );
}

export async function notifyAchievement(name: string, description: string) {
  await sendLocalNotification(
    `Achievement Unlocked: ${name}`,
    description,
    { type: "achievement", name },
    "achievements",
  );
}

export async function notifyFriendRequest(username: string) {
  await sendLocalNotification(
    "New Friend Request",
    `${username} wants to be your friend!`,
    { type: "friend_request", username },
    "social",
  );
}

export async function notifyGiftReceived(fromUsername: string) {
  await sendLocalNotification(
    "Gift Received!",
    `${fromUsername} sent you a gift! Tap to open.`,
    { type: "gift_received", fromUsername },
    "social",
  );
}
