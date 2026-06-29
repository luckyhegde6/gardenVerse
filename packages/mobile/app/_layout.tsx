import React, { useEffect } from "react";
import { View, Text, LogBox } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@stores/authStore";
import { ErrorBoundary } from "@components/ui/ErrorBoundary";
import { DebugOverlay } from "@components/ui/DebugOverlay";
import { useWebSocket } from "@hooks/useWebSocket";
import { initLogger } from "@services/logger";
import {
  registerForPushNotifications,
  setupNotificationHandlers,
} from "@services/notifications";
import { typography } from "@/styles/theme";
import { ThemeProvider, useTheme } from "@/styles/ThemeContext";

initLogger();

LogBox.ignoreLogs(["Reanimated", "ViewPropTypes"]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    },
    mutations: {
      retry: 1,
    },
  },
});

function RootContent() {
  const { isAuthenticated, isLoading, loadStoredAuth, ...storeState } =
    useAuthStore();
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useWebSocket();

  // ─── Push Notifications ───────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotifications();

    const cleanup = setupNotificationHandlers(
      // Foreground notification received
      (_notification) => {
        // Could update local state here (e.g., badge count)
      },
      // Notification tapped (background/killed)
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.type === "growth_ready" && data?.cropId) {
          router.push({ pathname: "/crop-detail/[cropId]", params: { cropId: data.cropId as string } });
        } else if (data?.type === "friend_request") {
          router.push("/friends");
        } else if (data?.type === "gift_received") {
          router.push("/friends");
        } else if (data?.type === "weather_alert") {
          router.push("/(tabs)/garden");
        }
      },
    );

    return cleanup;
  }, [isAuthenticated]);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)/garden");
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.background }}>
        <Text style={{ fontSize: 64, marginBottom: 16 }}>🌿</Text>
        <Text style={{ ...typography.h2, color: theme.primary }}>GardenVerse</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="plant-crop" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="crop-detail/[cropId]" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="create-listing" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="listing-detail/[listingId]" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="group-detail/[groupId]" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="chat" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="daily-rewards" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="quests" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="friends" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="add-friend" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="garden-visit/[friendId]" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="inventory" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="achievements" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="invites" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="admin" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="shop" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="plots" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="plot-detail/[plotId]" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="real-gardener" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="coupon-redeem" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="soil-check/[plotId]" options={{ headerShown: false, presentation: 'card' }} />
          </>
        ) : (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        )}
      </Stack>
      {__DEV__ && <DebugOverlay storeState={storeState as Record<string, unknown>} />}
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <RootContent />
            </ThemeProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
