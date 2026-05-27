# Mobile Architecture

## Component Hierarchy

```
App
├── Providers
│   ├── ReactQueryProvider          # TanStack Query
│   ├── AuthProvider                # Auth context
│   ├── SocketProvider              # WebSocket connection
│   ├── ThemeProvider               # NativeWind theme
│   └── OfflineBanner              # Connectivity indicator
│
├── NavigationContainer
│   ├── AuthStack                   # Unauthenticated
│   │   ├── WelcomeScreen
│   │   ├── LoginScreen
│   │   ├── RegisterScreen
│   │   ├── VerifyOtpScreen
│   │   ├── ForgotPasswordScreen
│   │   └── OnboardingScreen
│   │
│   ├── MainTabs                    # Authenticated
│   │   ├── GardenStack
│   │   │   ├── GardenScreen
│   │   │   ├── CropDetailScreen
│   │   │   ├── PlantScreen
│   │   │   └── GardenStatsScreen
│   │   │
│   │   ├── MarketplaceStack
│   │   │   ├── MarketplaceScreen
│   │   │   ├── ListingDetailScreen
│   │   │   ├── CreateListingScreen
│   │   │   └── MyListingsScreen
│   │   │
│   │   ├── CommunityStack
│   │   │   ├── CommunityScreen
│   │   │   ├── GroupDetailScreen
│   │   │   ├── ChatScreen
│   │   │   └── ProfileScreen
│   │   │
│   │   ├── AITab
│   │   │   ├── ScanScreen
│   │   │   ├── ScanResultsScreen
│   │   │   ├── RecommendationsScreen
│   │   │   └── PlantLibraryScreen
│   │   │
│   │   └── ProfileTab
│   │       ├── ProfileScreen
│   │       ├── SettingsScreen
│   │       ├── DevicesScreen
│   │       ├── NotificationsScreen
│   │       └── LeaderboardScreen
│   │
│   └── Modals
│       ├── QRScannerModal
│       ├── ImagePickerModal
│       ├── LocationPickerModal
│       └── ConfirmationModal
│
└── Shared Components
    ├── ui/                         # Atomic design
    │   ├── Button, Input, Card
    │   ├── Avatar, Badge, Chip
    │   ├── Loading, ErrorBoundary
    │   └── EmptyState, Toast
    ├── garden/
    │   ├── PlotGrid, CropCard
    │   ├── WaterMeter, GrowthBar
    │   └── GardenMap
    ├── charts/
    │   ├── GrowthChart, MoistureChart
    │   └── WeatherChart
    └── common/
        ├── Header, BottomSheet
        └── PullToRefresh, PaginatedList
```

## State Management (Zustand Stores)

```
┌──────────────────────────────────────────────────────────────┐
│                     ZUSTAND STORES                            │
│                                                               │
│  useAuthStore                                                 │
│  ├── state: { user, tokens, isAuthenticated }                 │
│  ├── actions: { login, register, logout, refreshToken }       │
│  └── persist: SecureStore (token), AsyncStorage (user)        │
│                                                               │
│  useGardenStore                                               │
│  ├── state: { gardens, activeGarden, crops, loading }         │
│  ├── actions: { fetchGardens, plantCrop, waterCrop }          │
│  └── persist: AsyncStorage (offline cache)                    │
│                                                               │
│  useChatStore                                                  │
│  ├── state: { conversations, activeChat, messages }           │
│  ├── actions: { sendMessage, fetchConversations }             │
│  └── persist: AsyncStorage (last 50 msgs)                     │
│                                                               │
│  useNotificationStore                                          │
│  ├── state: { notifications, unreadCount }                    │
│  ├── actions: { markRead, fetchNotifications }                │
│  └── persist: AsyncStorage                                   │
│                                                               │
│  useSocketStore                                                │
│  ├── state: { socket, isConnected, activeRooms }              │
│  ├── actions: { connect, disconnect, joinRoom, leaveRoom }   │
│  └── persist: false (ephemeral)                               │
│                                                               │
│  useLocationStore                                              │
│  ├── state: { currentLocation, geohash, permission }          │
│  ├── actions: { updateLocation, fetchNearby }                 │
│  └── persist: AsyncStorage (last known location)              │
│                                                               │
│  useIoTStore                                                   │
│  ├── state: { devices, liveReadings }                         │
│  ├── actions: { fetchDevices, registerDevice }                │
│  └── persist: AsyncStorage                                    │
│                                                               │
│  useOfflineStore                                               │
│  ├── state: { pendingActions, isOnline, syncQueue }           │
│  ├── actions: { queueAction, processQueue }                   │
│  └── persist: AsyncStorage (sync queue)                       │
└──────────────────────────────────────────────────────────────┘
```

## Navigation Structure

```
RootNavigator (NativeStack)
│
├── AuthGroup (NativeStack - when !isAuthenticated)
│   ├── Welcome         /welcome
│   ├── Login           /login
│   ├── Register        /register
│   ├── VerifyOtp       /verify-otp
│   ├── ForgotPassword  /forgot-password
│   └── Onboarding      /onboarding
│
└── MainGroup (BottomTab - when isAuthenticated)
    │
    ├── Tab: Garden
    │   └── GardenStack (NativeStack)
    │       ├── Dashboard     /garden
    │       ├── CropDetail    /garden/crop/:id
    │       ├── Plant         /garden/plant
    │       ├── PlotArrange   /garden/arrange
    │       └── Stats         /garden/stats
    │
    ├── Tab: Marketplace
    │   └── MarketplaceStack (NativeStack)
    │       ├── Browse        /marketplace
    │       ├── Listing       /marketplace/listing/:id
    │       ├── Create        /marketplace/create
    │       └── MyListings    /marketplace/my
    │
    ├── Tab: AI (center button)
    │   └── AIStack (NativeStack)
    │       ├── Scan          /ai/scan
    │       ├── Results       /ai/scan/:id
    │       ├── Recommendations /ai/recommendations
    │       └── PlantLib      /ai/plants
    │
    ├── Tab: Community
    │   └── CommunityStack (NativeStack)
    │       ├── Feed          /community
    │       ├── Group         /community/group/:id
    │       ├── Chat          /community/chat/:userId
    │       └── GroupChat     /community/group/:id/chat
    │
    └── Tab: Profile
        └── ProfileStack (NativeStack)
            ├── Profile       /profile
            ├── Settings      /profile/settings
            ├── Devices       /profile/devices
            ├── Notifications /profile/notifications
            ├── Leaderboard   /profile/leaderboard
            └── Invites       /profile/invites
```

## Data Fetching (React Query)

```
┌──────────────────────────────────────────────────────────────┐
│                   REACT QUERY CONFIGURATION                   │
│                                                               │
│  Global Defaults:                                             │
│  ├── staleTime: 5 * 60 * 1000   (5 min)                      │
│  ├── gcTime: 30 * 60 * 1000     (30 min)                     │
│  ├── retry: 2                                               │
│  ├── refetchOnWindowFocus: true                               │
│  └── refetchOnReconnect: true                                 │
│                                                               │
│  Query Keys Pattern:                                          │
│  ├── ['gardens', gardenId]                                    │
│  ├── ['crops', gardenId]                                      │
│  ├── ['marketplace', 'listings', filters]                     │
│  ├── ['weather', region]                                      │
│  ├── ['notifications']                                        │
│  ├── ['profile', userId]                                      │
│  ├── ['devices', userId]                                      │
│  └── ['leaderboard', type]                                    │
│                                                               │
│  Mutation Hooks:                                              │
│  ├── usePlantCrop      → invalidates ['crops', gardenId]     │
│  ├── useWaterCrop      → invalidates ['crops', cropId]       │
│  ├── useHarvest        → invalidates ['crops', gardenId]     │
│  ├── useCreateListing  → invalidates ['marketplace']         │
│  ├── usePurchase       → invalidates ['marketplace']         │
│  ├── useSendMessage    → optimistic update chat              │
│  └── useScanPlant      → invalidates ['ai', 'scans']         │
│                                                               │
│  Infinite Queries:                                            │
│  ├── marketplace/listings   (cursor-based pagination)        │
│  ├── notifications          (cursor-based pagination)        │
│  ├── chat/messages          (cursor-based pagination)        │
│  └── community/groups       (offset-based pagination)        │
└──────────────────────────────────────────────────────────────┘
```

## Offline Support Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                    OFFLINE STRATEGY                           │
│                                                               │
│  Layer 1: Persistent Cache (AsyncStorage)                     │
│  ├── Auth tokens in SecureStore                               │
│  ├── Garden & crop state                                      │
│  ├── Last known weather data                                  │
│  ├── Chat messages (last 100)                                 │
│  └── User profile                                             │
│                                                               │
│  Layer 2: Optimistic Updates                                  │
│  ├── Actions applied immediately to UI                        │
│  ├── Queued in useOfflineStore                                │
│  ├── Synced on reconnect                                      │
│  └── Conflict resolution: "last write wins"                   │
│                                                               │
│  Layer 3: Sync Queue                                          │
│  ├── ┌────────────────────────────────────────────────────┐  │
│  │   │  PendingAction {                                    │  │
│  │   │    id: string,          type: string,               │  │
│  │   │    endpoint: string,    body: object,               │  │
│  │   │    timestamp: number,   retries: number             │  │
│  │   │  }                                                  │  │
│  │   └────────────────────────────────────────────────────┘  │
│  ├── Process FIFO on reconnect                               │
│  ├── Max 3 retries per action                                │
│  └── Notify user on failure                                  │
│                                                               │
│  Layer 4: Connectivity Detection                              │
│  ├── NetInfo listener (online/offline events)                │
│  ├── Automated sync on reconnect                             │
│  ├── Visual banner when offline                              │
│  └── Disabled mutation buttons when offline                  │
└──────────────────────────────────────────────────────────────┘
```

## WebSocket Integration

```
┌──────────────────────────────────────────────────────────────┐
│                   SOCKET.IO INTEGRATION                       │
│                                                               │
│  Connection Lifecycle:                                        │
│  ┌─────────┐    ┌──────────┐    ┌───────────┐               │
│  │ Connect  │───►│ Auth     │───►│ Join      │               │
│  │ (handshake)│  │ (JWT)    │    │ Rooms     │               │
│  └─────────┘    └──────────┘    └───────────┘               │
│       │               │               │                      │
│       ▼               ▼               ▼                      │
│  useSocketStore manages connection state                     │
│                                                               │
│  Event Handlers:                                              │
│  ├── socket.on('garden:sync')        → useGardenStore        │
│  ├── socket.on('crop:update')        → invalidate query      │
│  ├── socket.on('notification:new')   → useNotificationStore  │
│  ├── socket.on('chat:message')       → useChatStore          │
│  ├── socket.on('weather:alert')      → toast notification    │
│  └── socket.on('sensor:update')      → useIoTStore           │
│                                                               │
│  Reconnection:                                                │
│  ├── Exponential backoff (1s, 2s, 4s, 8s, max 30s)          │
│  ├── Re-join all rooms on reconnect                           │
│  └── Refetch stale queries after reconnect                   │
└──────────────────────────────────────────────────────────────┘
```

## Permission Handling

```
┌──────────────────────────────────────────────────────────────┐
│                  PERMISSION MANAGEMENT                        │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Camera Permission                                      │ │
│  │  ├── Required for: AI Scan, QR Scanner                  │ │
│  │  ├── Request: on-demand (when feature accessed)          │ │
│  │  └── Fallback: Image picker from gallery                │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  Location Permission                                    │ │
│  │  ├── Required for: Geo features, weather accuracy        │ │
│  │  ├── Request: "When In Use" (foreground only)           │ │
│  │  ├── Granularity: Reduced accuracy (city-level)         │ │
│  │  └── Fallback: Manual region selection                  │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  Notification Permission                                 │ │
│  │  ├── Required for: Push notifications                   │ │
│  │  ├── Request: on first launch (post-auth)               │ │
│  │  └── Fallback: In-app notification center only          │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  Photo Library Permission                                │ │
│  │  ├── Required for: Avatar upload, gallery import         │ │
│  │  ├── Request: on-demand                                 │ │
│  │  └── Fallback: Camera capture only                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Performance Optimization Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                PERFORMANCE OPTIMIZATIONS                      │
│                                                               │
│  1. RENDERING                                                  │
│     ├── FlatList virtualization for long lists                │
│     ├── React.memo on expensive components                    │
│     ├── useMemo/useCallback for computed values               │
│     ├── FlashList (Shopify) for chat/marketplace              │
│     └── Image lazy loading + progressive loading              │
│                                                               │
│  2. IMAGES                                                     │
│     ├── expo-image for optimized loading                      │
│     ├── Cache images with expo-file-system                    │
│     ├── Thumbnail URLs from backend (CDN)                     │
│     └── Blurhash placeholders                                 │
│                                                               │
│  3. STATE                                                      │
│     ├── Zustand selectors prevent re-renders                  │
│     ├── React Query caching reduces API calls                 │
│     ├── Debounced search inputs                               │
│     └── Batch state updates                                   │
│                                                               │
│  4. NETWORK                                                    │
│     ├── Request deduplication (React Query)                   │
│     ├── Pagination for all list endpoints                     │
│     ├── Response compression (gzip)                           │
│     ├── Stale-while-revalidate pattern                        │
│     └── Prefetching on hover/focus                           │
│                                                               │
│  5. ANIMATIONS                                                 │
│     ├── react-native-reanimated for 60fps                    │
│     ├── Native driver for transforms/opacity                 │
│     ├── LayoutAnimation for list changes                     │
│     └── InteractionManager.runAfterInteractions for heavy ops │
│                                                               │
│  6. BUNDLE                                                     │
│     ├── Metro bundler optimizations                           │
│     ├── Lazy load screens (React.lazy)                       │
│     ├── Remove unnecessary polyfills                          │
│     └── Tree-shake unused modules                            │
│                                                               │
│  7. MEMORY                                                     │
│     ├── Clear query cache on logout                           │
│     ├── Limit chat message history in memory                  │
│     ├── Unsubscribe from listeners on unmount                │
│     └── Image cache size limits                              │
└──────────────────────────────────────────────────────────────┘
```
