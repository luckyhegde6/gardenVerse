# 🌱 GardenVerse Mobile — Phased Enhancement & UX Plan

> **Vision**: Transform GardenVerse mobile from a functional gardening app into a deeply engaging, polished, and socially-connected agriculture simulation game that keeps users coming back daily.

> **Current State**: Expo 51 + React Native 0.74 + NativeWind v4, 32+ screens, Zustand stores, Socket.IO, growth engine, gamification service, AI scanner, marketplace, community, IoT, weather.

---

## 📊 Current Architecture Assessment

### ✅ Strengths
- **Solid foundation**: Expo Router file-based routing, TypeScript strict mode, Zustand state management
- **Rich feature set**: Garden (2D/3D), marketplace, community, AI scanner, IoT, weather, gamification
- **Growth engine**: Client-side tick-based simulation (30s = 1 tick, 100x virtual speed)
- **Gamification backend**: XP, levels, achievements, collections, masteries, streaks, green credits
- **Isometric SVG grid**: Beautiful hand-crafted isometric garden with crop sprites, health bars, growth dots
- **Walkthrough**: 5-step first-time overlay
- **Real-time**: Socket.IO notifications, WebSocket integration
- **API client**: Axios with auto token refresh, request queueing, debug logging

### ⚠️ Gaps & Pain Points
- **No offline support**: All data vanishes without network; no persistence layer
- **No haptic feedback**: Actions feel flat without tactile response
- **No sound/audio**: No ambient sounds, harvest jingles, or UI sounds
- **Achievements are mocked**: Hardcoded data instead of API-driven
- **No daily login rewards**: Missing a key retention mechanic
- **No push notifications**: `expo-notifications` installed but not fully configured for growth alerts
- **No social features depth**: No friend system, garden visits, or gifting
- **No plant disease simulation**: Disease exists in types but never triggers
- **No seasonal events**: Static experience, no time-limited content
- **No garden customization**: No themes, decorations, or personalization
- **No proper error boundaries**: Only basic error UI
- **No loading skeletons**: Only spinners, no content-placeholder loading
- **No pull-to-refresh consistency**: Some screens have it, others don't
- **No proper empty states**: Basic empty state component, not contextual
- **No analytics/tracking**: No user behavior tracking for game balance
- **No A/B testing framework**: Can't test game balance changes
- **No proper navigation state persistence**: Navigation resets on app kill
- **No image optimization**: No caching, no progressive loading
- **No proper accessibility**: Missing screen reader support, contrast issues
- **No animation polish**: Basic Reanimated usage, no micro-interactions
- **No proper onboarding flow**: Walkthrough is basic, no progressive disclosure
- **No quest/mission system**: Missing daily/weekly challenges
- **No garden comparison/competition**: No head-to-head features
- **No proper settings**: Settings screen is minimal
- **No data export**: Users can't export their garden data
- **No dark mode**: Only light theme
- **No proper testing**: No component tests, no snapshot tests

---

## 🗺️ Phase-by-Phase Implementation Plan

---

## PHASE 1: Foundation & Polish (Weeks 1-2)
**Goal**: Fix critical gaps, improve perceived performance, add tactile feedback

### 1.1 Offline-First Data Layer
```
Priority: CRITICAL
Effort: Medium
Impact: High
```
- **Add MMKV for fast persistent storage** (replace AsyncStorage for Zustand persist)
  - `npm install react-native-mmkv` — 10x faster than AsyncStorage
  - Persist garden state, user profile, achievements, inventory
- **Implement optimistic updates** for water/fertilize/harvest actions
  - Update UI immediately, sync in background, rollback on failure
- **Add network state detection** (`@react-native-community/netinfo`)
  - Show offline banner, queue actions for sync
- **Cache API responses** with TTL in MMKV
  - Weather: 15min TTL, Marketplace: 5min TTL, Static data: 24h TTL

### 1.2 Haptic Feedback System
```
Priority: HIGH
Effort: Low
Impact: High (perceived quality)
```
```typescript
// src/utils/haptics.ts
import * as Haptics from 'expo-haptics';

export const HapticFeedback = {
  // Light tap for selections
  select: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  
  // Medium for actions (water, fertilize)
  action: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  
  // Heavy for harvest
  harvest: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  
  // Success pattern for achievements
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  
  // Warning for wilting/disease
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  
  // Error for failed actions
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  
  // Growth tick — subtle pulse
  growthTick: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
};
```
- Add to: water button, fertilize button, harvest button, plant selection, achievement unlock, crop wilting warning, navigation tab switch

### 1.3 Loading Skeletons & Progressive Loading
```
Priority: HIGH
Effort: Medium
Impact: High
```
- Create `SkeletonLoader` component with shimmer animation
- Add skeleton screens for:
  - Garden grid (tile placeholders)
  - Marketplace listings
  - Profile stats
  - Community groups
  - Weather data
  - AI scan results
- Implement progressive image loading with blurhash placeholders

### 1.4 Error Boundary & Crash Recovery
```
Priority: HIGH
Effort: Low
Impact: Medium
```
- Enhance existing `ErrorBoundary` component with:
  - Sentry integration (`@sentry/react-native`)
  - Retry mechanism
  - Graceful degradation (show cached data)
  - User-friendly error messages with illustrations

### 1.5 Navigation & State Persistence
```
Priority: MEDIUM
Effort: Medium
Impact: Medium
```
- Persist navigation state with `expo-router` + MMKV
- Deep link handling for:
  - Garden sharing links
  - Invite codes
  - Marketplace listing links
  - Push notification navigation
- Add proper back button handling for Android

### 1.6 Accessibility Pass
```
Priority: MEDIUM
Effort: Medium
Impact: Medium
```
- Add `accessibilityLabel` to all interactive elements
- Add `accessibilityHint` for complex interactions
- Ensure color contrast ratios meet WCAG AA
- Support Dynamic Type (font scaling)
- Add screen reader navigation order
- Test with TalkBack (Android) and VoiceOver (iOS)

**Phase 1 Deliverables:**
- [ ] MMKV storage layer with Zustand persist
- [ ] Network detection + offline banner
- [ ] Haptic feedback on all actions
- [ ] Skeleton loaders for 6+ screens
- [ ] Enhanced error boundaries with Sentry
- [ ] Navigation state persistence
- [ ] Deep link handling
- [ ] Accessibility audit + fixes

---

## PHASE 1.5: Garden Screen — Core Game Feel & Interactivity (Week 1-2)
**Goal**: Transform GardenScreen from a functional grid into a playable, juicy game loop

### 1.5.1 Guided First Plant Experience
```
Priority: CRITICAL | Effort: Medium | Impact: CRITICAL
```
- **Animated empty plot hint**: Pulsing "+" on center tile (3,3) with "Tap to plant" tooltip
- **Seed Selection Bottom Sheet**: Horizontal carousel of starter seeds (Tomato, Chilli, Mint)
  - Each card: sprite preview, growth time, yield, rarity badge
  - One-tap select → confirm → planting animation
- **Planting Animation Sequence** (1.5s):
  1. Seed drops from top with bounce
  2. Soil puff particle burst (Skia)
  3. Sprout emerges with spring scale animation
  4. Success chime + light haptic
- **Starter Seeds**: Grant 3 free seeds on first garden creation (server-side)

### 1.5.2 Action Feedback System (Juice)
```
Priority: CRITICAL | Effort: Low | Low | Impact: HIGH
```
- **Unified Feedback Service** (`src/utils/gameFeedback.ts`):
  ```typescript
  plant:   { haptic: medium, sound: 'plant.wav',   particles: 'soilPuff' }
  water:   { haptic: medium, sound: 'water.wav',   particles: 'droplets' }
  fertilize:{ haptic: medium, sound: 'fertilize.wav', particles: 'sparkles' }
  harvest: { haptic: heavy,  sound: 'harvest.wav', particles: 'burst + coins' }
  levelUp: { haptic: success, sound: 'levelup.wav', particles: 'confetti' }
  growthTick: { haptic: light, particles: 'subtlePulse' }
  ```
- **Skia Particle System** (`components/garden/ParticleSystem.tsx`):
  - `DropletEmitter` — gravity-affected water drops
  - `SparkleBurst` — radial green/gold particles
  - `ConfettiExplosion` — physics-based rectangles
  - `SubtlePulse` — scale pulse on crop sprite
- **Integration**: Wrap `AnimatedActionButton` to trigger on press

### 1.5.3 3D View Interaction Parity
```
Priority: HIGH | Effort: Medium | Impact: HIGH
```
- **Raycast Tap Detection** in `Garden3D`:
  - On tap, cast ray from camera through tap point
  - Find intersected crop mesh → select crop
  - Show same action buttons (Water/Fertilize/Harvest) as 2D
- **Camera Focus Animation**: Smooth pan/zoom to selected plant
- **Selection Ring**: Already exists — ensure visible on tap

### 1.5.4 Empty State Gamification
```
Priority: HIGH | Effort: Low | Impact: HIGH
```
- **Starter Seed Grant**: API call on garden creation → 3 common seeds
- **Animated Plot Hints**: 
  - Pulsing scale on empty tiles (staggered)
  - "Drag seed here" ghost preview when seed selected
- **Progressive Tooltips**: "Plant → Water → Harvest" cycle hint (dismissible)

### 1.5.5 Growth Tick Visual Feedback
```
Priority: HIGH | Effort: Low | Impact: MEDIUM
```
- **GrowthEngine Event**: Emit `onGrowthTick(crops)` callback
- **IsometricGrid Listener**: On tick, trigger `SubtlePulse` on all growing crops
- **Visual**: 200ms scale pulse (1.0 → 1.05 → 1.0) + light haptic

### 1.5.6 Daily Quest Tracker Widget
```
Priority: HIGH | Effort: Medium | Impact: HIGH
```
- **Header Widget** (below garden name, above grid):
  - Circular progress ring for active daily quest
  - Quest title: "Water 3 crops" / "Harvest 2 crops"
  - Tap → expands to full quest list (navigate to Quests screen)
- **Auto-Update**: Listen to local action events → update progress optimistically
- **Claim Animation**: Reward flies from widget → currency counter

### 1.5.7 Skia Particle System Foundation
```
Priority: HIGH | Effort: Medium | Impact: HIGH (enabler)
```
- **New Components**:
  - `ParticleSystem.tsx` — Skia Canvas + ParticleEmitter registry
  - `useParticles.ts` — Hook: `emit('water', {x, y})`, `emit('harvest', {x, y})`
  - `ParticlePresets.ts` — Pre-configured emitters for each action
- **Performance**: Single Skia canvas overlay, GPU-instanced particles

---

### New Components for Phase 1.5
```
packages/mobile/src/components/garden/
├── PlantSelectionSheet.tsx      # Seed carousel bottom sheet
├── ParticleSystem.tsx           # Skia canvas + emitters
├── useParticles.ts              # Particle emission hook
├── ParticlePresets.ts           # Water, fertilize, harvest, plant, confetti
├── XPCelebration.tsx            # Floating XP numbers (Phase 2)
├── LevelUpModal.tsx             # Full-screen level up (Phase 2)
├── CropDetailModal.tsx          # Long-press inspection (Phase 2)
├── QuestTrackerWidget.tsx       # Daily quest progress on header
└── WeatherParticles.tsx         # Rain/snow/heat (Phase 3)
```

### Dependencies to Add
```json
{
  "@shopify/react-native-skia": "^1.7.0",
  "expo-av": "~14.0.0"
}
```

### E2E Test Specs (Playwright)
```typescript
// e2e/tests/garden-game-feel.spec.ts
test.describe('Garden Screen — Game Feel', () => {
  test('First-time user completes plant→water→harvest loop', async ({ page }) => {
    await login(page, 'demo@gardenverse.vercel.app');
    await page.goto('/garden');
    
    // Guided plant
    await page.click('[data-testid="plot-3-3"]');
    await page.click('[data-testid="seed-tomato"]');
    await page.click('[data-testid="confirm-plant"]');
    await expect(page.locator('[data-testid="planting-animation"]')).toBeVisible();
    
    // Water with feedback
    await page.click('[data-testid="water-button"]');
    await expect(page.locator('[data-testid="water-particles"]')).toBeVisible();
    
    // Fast-forward & harvest
    await page.evaluate(() => growthEngine.forceTick());
    await page.click('[data-testid="harvest-button"]');
    await expect(page.locator('[data-testid="xp-toast"]')).toBeVisible();
  });
  
  test('2D/3D toggle preserves selection', async ({ page }) => {
    // ... select crop in 2D, toggle to 3D, verify selection ring
  });
  
  test('Quest widget updates on action', async ({ page }) => {
    // ... verify progress ring fills on water action
  });
});
```

---

## 📋 Implementation Order (Phase 1.5)

| Week | Task | Dependencies |
|------|------|--------------|
| 1 | 1.5.7 Skia Particle System | npm install |
| 1 | 1.5.2 Action Feedback (haptics + particles + sound) | 1.5.7 |
| 1 | 1.5.5 Growth Tick Pulse | 1.5.7 |
| 1 | 1.5.3 3D Tap Interaction | — |
| 2 | 1.5.1 Guided First Plant + Seed Sheet | 1.5.2 |
| 2 | 1.5.4 Empty State Gamification | 1.5.1 |
| 2 | 1.5.6 Quest Tracker Widget | — |
| 2 | E2E Tests + Polish | All above |

---

## 🎯 Success Metrics (Phase 1.5)

| Metric | Target | Measurement |
|--------|--------|-------------|
| First plant completion | > 85% | `garden.first_plant` event |
| Actions per session | > 20 | Water + fertilize + harvest |
| Session duration (garden) | > 6 min | Screen time analytics |
| 3D view usage | > 30% | Toggle event tracking |
| Quest widget engagement | > 50% | Tap-through to quests |

---

*This garden-specific phase integrates with the existing Phase 1 (Foundation) and Phase 2 (Engagement) — it's the "game feel" layer that makes the garden screen playable.*

---

## PHASE 2: Engagement & Retention Systems (Weeks 3-4)
**Goal**: Add daily retention mechanics, push notifications, and quest system

### 2.1 Daily Login Rewards
```
Priority: CRITICAL
Effort: Medium
Impact: CRITICAL (retention)
```
- **7-day reward cycle** with escalating rewards:
  - Day 1: 10 Green Credits + 1 Common Seed
  - Day 2: 20 Green Credits + 5 XP Boost
  - Day 3: 30 Green Credits + 1 Uncommon Seed
  - Day 4: 50 Green Credits + Growth Booster
  - Day 5: 75 Green Credits + 1 Rare Seed
  - Day 6: 100 Green Credits + Super Bloom
  - Day 7: 200 Green Credits + 1 Legendary Seed + 500 XP
- **Streak protection**: 1 "freeze" per week (doesn't break streak)
- **Visual calendar UI**: Show upcoming rewards, highlight current day
- **API integration**: `GET /gamification/daily-reward`, `POST /gamification/claim-daily`

### 2.2 Push Notification System
```
Priority: CRITICAL
Effort: High
Impact: CRITICAL (retention)
```
- **Configure expo-notifications** with proper channels:
  - Growth alerts: "Your Tomato is ready to harvest! 🍅"
  - Water reminders: "Your crops are thirsty! 3 crops below 25% hydration"
  - Weather alerts: "Heavy rain expected — protect your garden! 🌧️"
  - Social: "GreenMaster visited your garden 👀"
  - Marketplace: "Your listing 'Organic Tomatoes' sold! 🎉"
  - Achievement: "New achievement unlocked: Water Wizard! 💧"
  - Streak: "Don't break your 15-day streak! Come back now 🔥"
- **Smart notification batching**: Group similar notifications
- **Quiet hours**: Respect user's Do Not Disturb settings
- **Notification preferences**: Per-category toggle in Settings
- **Rich notifications**: Images, action buttons (Water All, Harvest All)

### 2.3 Quest / Mission System
```
Priority: HIGH
Effort: High
Impact: High (engagement)
```
- **Daily Quests** (reset at midnight user timezone):
  - "Water 5 crops" → 50 XP + 10 Credits
  - "Harvest 2 mature crops" → 100 XP + 20 Credits
  - "Plant 3 new seeds" → 75 XP + 15 Credits
  - "Fertilize 3 crops" → 60 XP + 10 Credits
  - "Scan a plant with AI" → 40 XP + 5 Credits
- **Weekly Quests** (reset Monday):
  - "Maintain a 7-day care streak on any crop" → 500 XP + 100 Credits
  - "Harvest 20 crops" → 750 XP + 1 Rare Seed
  - "Discover 3 new plant species" → 600 XP + Growth Booster
  - "Complete 10 daily quests" → 1000 XP + Legendary Seed
- **Seasonal Quests** (monthly):
  - "Grow 5 different summer vegetables" → 2000 XP + Season Badge
  - "Achieve 100% collection in any plant family" → 3000 XP + Title
- **Quest UI**: Dedicated quest tab in profile, progress bars, claim animations
- **API**: `GET /gamification/quests`, `POST /gamification/quests/:id/claim`

### 2.4 Enhanced Gamification
```
Priority: HIGH
Effort: Medium
Impact: High
```
- **Real-time XP counter**: Animated XP gain on actions
- **Level-up celebration**: Full-screen animation with confetti
- **Achievement categories**: Gardening, Social, Marketplace, IoT, Explorer, Streak
- **Achievement rarities**: Bronze, Silver, Gold, Platinum, Diamond
- **Hidden achievements**: Secret achievements for discovery
- **Achievement showcase**: Pin 3 achievements to profile
- **Leaderboard**: Global + Friends + Regional tabs
- **API**: Wire up AchievementsScreen to real API (remove mock data)

### 2.5 Streak System Enhancement
```
Priority: MEDIUM
Effort: Medium
Impact: Medium
```
- **Visual streak calendar** (GitHub-style contribution graph)
- **Streak milestones**: 3, 7, 14, 30, 60, 100, 365 days with rewards
- **Streak shields**: Earn shields to protect streaks (max 2)
- **Streak recovery**: Watch ad / spend credits to recover broken streak
- **Crop care streaks**: Per-crop daily care tracking

**Phase 2 Deliverables:**
- [ ] Daily login reward system with 7-day cycle
- [ ] Push notifications (6 categories, rich notifications)
- [ ] Quest system (daily, weekly, seasonal)
- [ ] Real-time XP animations + level-up celebrations
- [ ] Real achievements API integration
- [ ] Leaderboard with global/friends/regional
- [ ] Streak calendar + milestones
- [ ] Notification preferences in Settings

---

## PHASE 3: Social & Community Expansion (Weeks 5-6)
**Goal**: Deepen social connections, add competitive elements, enable sharing

### 3.1 Friend System
```
Priority: HIGH
Effort: High
Impact: High
```
- **Add friends**: Via username, QR code, nearby gardeners, invite link
- **Friend list**: Online status, level, garden preview
- **Friend activity feed**: "GreenMaster harvested 🌾 Wheat", "EcoWarrior unlocked 🏆 Master Farmer"
- **Friend requests**: In-app + push notification
- **API**: `POST /users/friends/request`, `GET /users/friends`, `DELETE /users/friends/:id`

### 3.2 Garden Visits
```
Priority: HIGH
Effort: Medium
Impact: High
```
- **Visit friend's garden**: See their layout, crops, decorations
- **Leave gifts**: Water a friend's crop, leave a fertilizer gift
- **Garden rating**: Rate gardens 1-5 stars with optional comment
- **Most visited gardens**: Weekly showcase of top-rated gardens
- **Garden themes**: Seasonal decorations, custom layouts
- **API**: `GET /gardens/:userId/visit`, `POST /gardens/:id/rate`

### 3.3 Gifting System
```
Priority: MEDIUM
Effort: Medium
Impact: Medium
```
- **Send gifts**: Seeds, fertilizers, tools, cosmetics to friends
- **Daily gift limit**: 3 gifts per day (prevents abuse)
- **Gift notifications**: "GreenMaster sent you a Rare Seed! 🎁"
- **Special gifts**: Event-exclusive gifts during seasonal events

### 3.4 Community Challenges
```
Priority: HIGH
Effort: Medium
Impact: High
```
- **Group challenges**: Community-wide goals ("Collectively harvest 10,000 crops")
- **Regional competitions**: "Best garden in Karnataka this month"
- **Seasonal tournaments**: "Summer Harvest Championship"
- **Team challenges**: Groups compete against other groups
- **Rewards**: Exclusive badges, titles, seeds, cosmetics

### 3.5 Social Sharing
```
Priority: MEDIUM
Effort: Medium
Impact: Medium
```
- **Share garden screenshot**: Auto-generated beautiful garden card
- **Share achievements**: "I just unlocked Master Farmer in GardenVerse! 🏆"
- **Share harvests**: "Just harvested 50 Organic Tomatoes! 🍅"
- **Invite to app**: Personalized invite with referral rewards
- **API**: `POST /users/share`, `GET /users/referral-code`

### 3.6 Enhanced Community Screen
```
Priority: MEDIUM
Effort: Medium
Impact: Medium
```
- **Events system**: Virtual gardening workshops, AMAs with experts
- **Mentorship program**: Experienced gardeners mentor newcomers
- **Regional hubs**: Location-based community groups
- **Photo sharing**: Garden photo feed with likes and comments
- **Tips & guides**: Community-generated gardening content

**Phase 3 Deliverables:**
- [ ] Friend system with activity feed
- [ ] Garden visit + rating feature
- [ ] Gifting system
- [ ] Community challenges (group, regional, seasonal)
- [ ] Social sharing with auto-generated cards
- [ ] Events system + mentorship
- [ ] Photo sharing feed

---

## PHASE 4: Game Depth & Simulation (Weeks 7-8)
**Goal**: Add deeper simulation mechanics, plant breeding, seasonal events

### 4.1 Plant Breeding / Hybridization
```
Priority: HIGH
Effort: High
Impact: High (game depth)
```
- **Cross-breeding**: Combine two plant species to create hybrids
- **Genetics system**: Dominant/recessive traits, mutation chance
- **Hybrid discovery log**: Track all discovered combinations
- **Rare hybrids**: Some combinations produce ultra-rare plants
- **Breeding time**: Real-time breeding (hours to days)
- **API**: `POST /gamification/hybrid`, `GET /gamification/hybrids`

### 4.2 Plant Disease & Pest System
```
Priority: HIGH
Effort: Medium
Impact: High (game depth)
```
- **Disease triggers**: Based on low health, poor hydration, weather conditions
- **Disease types**: Fungal, Bacterial, Viral, Pest infestation
- **Treatment**: Specific treatments for different diseases (purchasable)
- **Spread mechanic**: Diseased crops can spread to adjacent plots
- **Prevention**: Proper care reduces disease chance
- **AI Scanner integration**: Scan diseased crops for diagnosis
- **API**: `GET /diseases/crop/:cropId`, `POST /diseases/:id/treat`

### 4.3 Seasonal Events & Calendar
```
Priority: HIGH
Effort: High
Impact: CRITICAL (retention + monetization)
```
- **Spring Festival** (March-May): Cherry blossom seeds, spring decorations
- **Summer Harvest** (June-August): Watermelon challenge, monsoon alerts
- **Autumn Glory** (September-November): Pumpkin growing contest
- **Winter Wonderland** (December-February): Greenhouse mechanics, holiday cosmetics
- **Indian festivals**: Pongal harvest, Onam garden, Baisakhi planting
- **Event shop**: Exclusive seeds, cosmetics, boosters
- **Event quests**: Special limited-time quests
- **API**: `GET /campaigns`, `GET /campaigns/rewards`

### 4.4 Garden Customization
```
Priority: MEDIUM
Effort: High
Impact: Medium
```
- **Garden themes**: Zen garden, Tropical, Desert, English cottage
- **Decorations**: Fences, paths, fountains, statues, lighting
- **Layout editor**: Drag-and-drop plot arrangement
- **Greenhouse**: Unlockable structure for year-round growing
- **Background music**: Ambient garden sounds per theme
- **API**: `GET /gardens/themes`, `POST /gardens/decorate`

### 4.5 Advanced Growth Engine
```
Priority: MEDIUM
Effort: Medium
Impact: Medium
```
- **Weather integration**: Real weather affects growth speed
- **Soil pH system**: Different plants prefer different pH levels
- **Companion planting**: Certain plants boost each other's growth
- **Crop rotation**: Planting same crop repeatedly depletes soil
- **Pollination**: Attract bees/butterflies for growth boost
- **Growth stages**: More granular stages with unique visuals

### 4.6 Weather-Driven Gameplay
```
Priority: MEDIUM
Effort: Medium
Impact: Medium
```
- **Real weather API integration**: Affects virtual garden
- **Rain events**: Auto-waters crops, but can cause flooding
- **Heat waves**: Increase water consumption, risk of wilting
- **Frost warnings**: Protect crops or lose them
- **Monsoon mode**: Special challenges during rainy season
- **Weather forecasts**: 7-day forecast with garden impact predictions

**Phase 4 Deliverables:**
- [ ] Plant breeding/hybridization system
- [ ] Disease & pest simulation with treatment
- [ ] 4 seasonal events + Indian festival events
- [ ] Garden customization (themes, decorations)
- [ ] Advanced growth engine (weather, soil pH, companion planting)
- [ ] Weather-driven gameplay mechanics

---

## PHASE 5: Monetization & Growth (Weeks 9-10)
**Goal**: Add ethical monetization, referral system, and growth features

### 5.1 Ethical Monetization
```
Priority: HIGH
Effort: High
Impact: Revenue
```
- **Premium seeds**: Exclusive plant species (cosmetic + faster growth)
- **Growth boosters**: 2x growth speed for 24h (earned or purchased)
- **Garden expansions**: Unlock additional plots (6x6 → 8x8 → 10x10)
- **Cosmetic shop**: Decorations, themes, particle effects
- **Season pass**: Monthly subscription with exclusive rewards
- **No pay-to-win**: All gameplay items earnable through play
- **API**: `POST /marketplace/purchase`, `GET /marketplace/shop`

### 5.2 Referral & Virality
```
Priority: MEDIUM
Effort: Medium
Impact: Growth
```
- **Referral codes**: Unique code per user
- **Referral rewards**: Both referrer and referee get rewards
  - Referrer: 100 Credits + Rare Seed per referral
  - Referee: 50 Credits + Growth Booster starter pack
- **Milestone rewards**: 5 referrals → Legendary Seed, 10 → Exclusive Title
- **Social sharing**: Pre-made share cards for Instagram, WhatsApp

### 5.3 User-Generated Content
```
Priority: MEDIUM
Effort: Medium
Impact: Engagement
```
- **Garden templates**: Share garden layouts for others to use
- **Garden journals**: Document growing journey with photos
- **Tips sharing**: Community gardening tips with voting
- **Photo contests**: Weekly best garden photo competition

### 5.4 Data & Analytics
```
Priority: MEDIUM
Effort: Medium
Impact: Product decisions
```
- **Event tracking**: Track key actions (plant, water, harvest, share)
- **Funnel analysis**: Onboarding completion rate, D1/D7/D30 retention
- **A/B testing framework**: Test game balance changes
- **Crash analytics**: Sentry integration for error tracking
- **Performance monitoring**: Screen load times, API latency

**Phase 5 Deliverables:**
- [ ] Ethical monetization system (shop, season pass)
- [ ] Referral system with milestone rewards
- [ ] Garden template sharing
- [ ] Analytics + A/B testing framework
- [ ] Performance monitoring

---

## PHASE 6: Platform & Performance (Weeks 11-12)
**Goal**: Optimize performance, add platform-specific features, prepare for launch

### 6.1 Performance Optimization
```
Priority: HIGH
Effort: High
Impact: User experience
```
- **Image optimization**: WebP format, progressive loading, CDN
- **Bundle optimization**: Code splitting, lazy loading, tree shaking
- **Memory management**: Proper cleanup in useEffect, image cache limits
- **List virtualization**: FlashList for marketplace, community feeds
- **Animation optimization**: Use `worklet` for 60fps animations
- **API optimization**: Request deduplication, pagination, delta sync

### 6.2 Dark Mode
```
Priority: MEDIUM
Effort: Medium
Impact: Polish
```
- **System-aware dark mode**: Follow system preference
- **Manual toggle**: In Settings
- **Dark theme colors**: Carefully designed dark palette
- **Garden grid dark mode**: Adjusted soil/crop colors for dark background

### 6.3 Platform-Specific Features
```
Priority: MEDIUM
Effort: Medium
Impact: Platform polish
```
- **iOS**: 
  - Widget for garden status (iOS 14+)
  - App Clips for quick garden preview
  - Haptic Engine patterns
  - Siri Shortcuts for quick actions
- **Android**:
  - Home screen widget
  - Material You dynamic colors
  - Quick Settings tile
  - Adaptive icon
- **Web** (Expo Web):
  - PWA support with offline capability
  - Desktop-optimized layout
  - Keyboard shortcuts

### 6.4 Testing & Quality
```
Priority: HIGH
Effort: High
Impact: Stability
```
- **Unit tests**: Jest for services, stores, utilities
- **Component tests**: React Native Testing Library
- **E2E tests**: Detox for critical flows (plant → water → harvest)
- **Snapshot tests**: UI component regression testing
- **Performance tests**: Measure and track render times
- **Device testing**: Test on 10+ real devices (low-end to flagship)

### 6.5 App Store Optimization
```
Priority: MEDIUM
Effort: Low
Impact: Discovery
```
- **App Store screenshots**: 6 compelling screenshots per platform
- **Preview video**: 30-second gameplay trailer
- **App description**: SEO-optimized with keywords
- **Rating prompts**: Strategic rating request after positive moments
- **Privacy nutrition labels**: Accurate data usage disclosure

**Phase 6 Deliverables:**
- [ ] Performance optimization (bundle, images, memory)
- [ ] Dark mode with full theme support
- [ ] Platform-specific features (widgets, App Clips, PWA)
- [ ] Comprehensive testing suite
- [ ] App Store optimization

---

## 🏗️ Technical Architecture Enhancements

### New Dependencies to Add
```json
{
  "react-native-mmkv": "^2.12.0",          // Fast persistent storage
  "@react-native-community/netinfo": "^11.0", // Network detection
  "expo-haptics": "~13.0.0",               // Haptic feedback
  "expo-av": "~14.0.0",                    // Audio/sound effects
  "expo-blur": "~13.0.0",                  // Blur effects
  "expo-linear-gradient": "~13.0.0",       // Gradient backgrounds
  "@sentry/react-native": "~5.24.0",       // Crash reporting
  "react-native-view-shot": "~3.8.0",      // Screenshot sharing
  "react-native-share": "~10.2.0",         // Native share sheet
  "expo-clipboard": "~6.0.0",              // Clipboard access
  "react-native-flash-list": "^1.7.0",     // High-performance lists (or @shopify/flash-list)
  "@shopify/flash-list": "^1.7.0",         // Optimized FlatList
  "lottie-react-native": "~6.7.0",         // Rich animations
  "react-native-gesture-handler": "~2.16", // Already have, ensure latest
  "expo-constants": "~16.0.0",             // Device constants
  "expo-device": "~6.0.0",                 // Device info
  "expo-updates": "~0.25.0",               // OTA updates
  "expo-font": "~12.0.0",                  // Custom fonts
  "expo-splash-screen": "~0.27.0",         // Splash screen control
  "react-native-chart-kit": "^6.12.0",     // Already have
  "victory-native": "^37.3.0"              // Advanced charts
}
```

### New Directory Structure
```
packages/mobile/src/
├── app/                          # Expo Router screens
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── otp-verify.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── garden.tsx
│   │   ├── marketplace.tsx
│   │   ├── community.tsx
│   │   ├── scanner.tsx
│   │   └── profile.tsx
│   ├── garden/
│   │   ├── [cropId].tsx
│   │   ├── plant.tsx
│   │   ├── visit/[userId].tsx     # NEW: Visit friend's garden
│   │   └── map.tsx
│   ├── social/                     # NEW: Social features
│   │   ├── friends.tsx
│   │   ├── leaderboard.tsx
│   │   └── activity.tsx
│   ├── quests/                     # NEW: Quest system
│   │   ├── index.tsx
│   │   └── [questId].tsx
│   ├── events/                     # NEW: Seasonal events
│   │   ├── index.tsx
│   │   └── [eventId].tsx
│   ├── shop/                       # NEW: In-app shop
│   │   ├── index.tsx
│   │   └── season-pass.tsx
│   └── settings/
│       ├── index.tsx
│       ├── notifications.tsx
│       └── theme.tsx
├── components/
│   ├── garden/
│   │   ├── IsometricGrid.tsx
│   │   ├── CropSpriteSVG.tsx
│   │   ├── WalkthroughOverlay.tsx
│   │   ├── GrowthOverlay.tsx
│   │   ├── WeatherBar.tsx
│   │   ├── GardenAnalytics.tsx
│   │   ├── Minimap.tsx
│   │   ├── StreakBadge.tsx
│   │   ├── LevelProgress.tsx
│   │   ├── CompanionHint.tsx      # NEW: Companion planting hints
│   │   ├── DiseaseAlert.tsx        # NEW: Disease warning overlay
│   │   └── BreedingLab.tsx         # NEW: Hybridization UI
│   ├── social/                      # NEW: Social components
│   │   ├── FriendCard.tsx
│   │   ├── ActivityFeed.tsx
│   │   ├── GardenVisitor.tsx
│   │   └── GiftPicker.tsx
│   ├── quests/                      # NEW: Quest components
│   │   ├── QuestCard.tsx
│   │   ├── QuestProgress.tsx
│   │   ├── DailyRewardCalendar.tsx
│   │   └── LevelUpCelebration.tsx
│   ├── events/                      # NEW: Event components
│   │   ├── EventBanner.tsx
│   │   ├── EventQuestCard.tsx
│   │   └── EventShopItem.tsx
│   ├── shop/                        # NEW: Shop components
│   │   ├── ShopItem.tsx
│   │   ├── SeasonPassCard.tsx
│   │   └── PurchaseConfirmation.tsx
│   └── ui/
│       ├── SkeletonLoader.tsx       # NEW: Shimmer loading
│       ├── Confetti.tsx             # NEW: Celebration animation
│       ├── Toast.tsx
│       ├── Modal.tsx
│       └── ...
├── hooks/
│   ├── useGarden.ts
│   ├── useAuth.ts
│   ├── useNotifications.ts
│   ├── useHaptics.ts              # NEW: Haptic feedback hook
│   ├── useNetwork.ts              # NEW: Network state hook
│   ├── useQuests.ts               # NEW: Quest management
│   ├── useEvents.ts               # NEW: Seasonal events
│   ├── useSocial.ts               # NEW: Social features
│   ├── useShop.ts                 # NEW: In-app purchases
│   ├── useSound.ts                # NEW: Sound effects
│   └── useTheme.ts                # NEW: Theme management
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── growthEngine.ts
│   ├── gamification.ts
│   ├── websocket.ts
│   ├── logger.ts
│   ├── notifications.ts           # NEW: Push notification service
│   ├── analytics.ts               # NEW: Analytics service
│   ├── sound.ts                   # NEW: Sound effect service
│   └── storage.ts                 # NEW: MMKV storage service
├── stores/
│   ├── authStore.ts
│   ├── gardenStore.ts
│   ├── notificationStore.ts
│   ├── questStore.ts              # NEW: Quest state
│   ├── socialStore.ts             # NEW: Social state
│   ├── eventStore.ts              # NEW: Event state
│   └── themeStore.ts              # NEW: Theme state
├── styles/
│   ├── theme.ts
│   ├── darkTheme.ts               # NEW: Dark theme
│   └── animations.ts              # NEW: Shared animation configs
├── utils/
│   ├── haptics.ts                 # NEW: Haptic feedback helpers
│   ├── sound.ts                   # NEW: Sound helpers
│   ├── share.ts                   # NEW: Social sharing helpers
│   ├── image.ts                   # NEW: Image optimization helpers
│   └── permissions.ts
└── types/
    ├── index.ts
    ├── quest.ts                    # NEW: Quest types
    ├── event.ts                    # NEW: Event types
    ├── social.ts                   # NEW: Social types
    └── shop.ts                     # NEW: Shop types
```

---

## 📈 Success Metrics

### Phase 1-2 (Foundation + Engagement)
- App launch time: < 2 seconds
- Crash-free rate: > 99%
- D1 retention: > 40%
- D7 retention: > 20%
- Push notification opt-in: > 60%

### Phase 3-4 (Social + Depth)
- D30 retention: > 15%
- Daily active users: > 30% of installs
- Social connections per user: > 3
- Quest completion rate: > 50%
- Session duration: > 8 minutes

### Phase 5-6 (Monetization + Launch)
- Conversion to paid: > 3%
- Season pass adoption: > 5%
- App Store rating: > 4.5
- Referral rate: > 10% of users refer 1+ friend
- Crash-free rate: > 99.5%

---

## 🔄 Implementation Order Summary

| Phase | Focus | Duration | Key Outcome |
|-------|-------|----------|-------------|
| **1** | Foundation & Polish | Weeks 1-2 | Fast, tactile, accessible app |
| **2** | Engagement & Retention | Weeks 3-4 | Daily return habits formed |
| **3** | Social & Community | Weeks 5-6 | Viral growth + community |
| **4** | Game Depth | Weeks 7-8 | Deep simulation + events |
| **5** | Monetization | Weeks 9-10 | Revenue + growth systems |
| **6** | Platform & Launch | Weeks 11-12 | Polished, optimized, launched |

---

## 🎯 Quick Wins (Can Start Today)

1. **Add haptic feedback** to water/fertilize/harvest buttons (2 hours)
2. **Add skeleton loaders** for garden grid and marketplace (4 hours)
3. **Wire up achievements API** — remove mock data (3 hours)
4. **Add offline banner** with NetInfo (2 hours)
5. **Add XP animation** on actions (3 hours)
6. **Add proper empty states** with illustrations (4 hours)
7. **Add pull-to-refresh** to all list screens (2 hours)
8. **Add confirmation dialogs** for destructive actions (2 hours)

**Total: ~22 hours of high-impact improvements**

---

*This plan is a living document. Revisit and adjust based on user feedback, analytics data, and team capacity after each phase.*
