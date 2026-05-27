import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './navigation/AppNavigator';
import { useAuthStore } from './stores/authStore';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useWebSocket } from './hooks/useWebSocket';

LogBox.ignoreLogs(['Reanimated', 'ViewPropTypes']);

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

function AppContent() {
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useWebSocket();

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  return (
    <GestureHandlerRootView className="flex-1">
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
