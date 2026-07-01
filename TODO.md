# GardenVerse Implementation TODO

> **Reference:** See `.agents/TODO.md` for detailed implementation and `.opencode/plans/` for templates

## Quick Reference

| Category | Status |
|----------|--------|
| Database Schema | [x] Complete |
| Prisma Migrations | [x] Complete (1 migration) |
| Seed Data | [x] Complete |
| Authentication | [x] Complete |
| API Integrations | [x] Complete |
| Weather Pipeline | [x] Complete |
| Plant Data Pipeline | [x] Complete |
| Geospatial / Maps | [x] Complete |
| AI Vision Pipeline | [x] Complete |
| Marketplace | [x] Complete |
| Community Chat | [x] Complete |
| IoT Sensor Pipeline | [x] Complete |
| QR Invite System | [x] Complete |
| Agent Orchestration | [x] Complete |
| E2E Demo System | [x] Complete (8 workflows) |
| Dev Scripts | [x] Complete (8 PowerShell scripts) |
| Dev Infrastructure | [x] Complete (.opencode + .agents) |
| Sequence Diagrams | [x] Complete (10 diagrams) |
| Support Docs | [x] Complete (FAQ + Troubleshooting) |
| Vercel Deployment Guide | [x] Complete (Redis limitation documented) |
| Multi-Garden Economy (Admin UI + API) | [x] Complete |
| Multi-Garden Economy (Mobile) | [x] Complete (all 4 phases delivered) |

## Next Steps

### Short-term
- [ ] Run full E2E demo with backend running
- [ ] Run Chrome DevTools performance analysis
- [ ] Verify mobile app builds
- [ ] Test smart contract deployment

### Medium-term
- [ ] Write backend Jest unit tests (services, controllers)
- [ ] Write Playwright E2E test specs
- [ ] Add Redis caching to weather/plant endpoints
- [ ] IoT simulator with real MQTT broker

### Long-term
- [ ] Extract BullMQ from EventEmitter for agent communication
- [ ] Microservices extraction (auth, marketplace, community)
- [ ] Mobile app offline-first architecture

### Mobile App
- [x] Phase 1: Foundation (types, services, storage keys)
- [x] Phase 2: State Management (stores + hooks)
- [x] Phase 3: Navigation (route registration)
- [x] Phase 4: Screens (Shop, Plots, PlotDetail, RealGardener, CouponRedeem, SoilCheck; updated GardenScreen, ProfileScreen)
- [x] Emulator verification (Pixel_7_API_34): app launches, GardenScreen renders, Profile with new menu items confirmed

### Mobile App — UX Refactor & Design System (Session 19)

### Phase 0: Design System Foundation [x] Complete
- [x] Create `src/styles/tokens.ts` — color tokens, spacing scale, typography, shadows
- [x] Upgrade Card — Reanimated press animation (scale 1→0.96), hero image slot
- [x] Upgrade Button — Reanimated spring press, iconPosition prop
- [x] Upgrade Avatar — broken image fallback (catch load error → initials). Never show raw URLs.
- [x] Upgrade Modal — Replace RN Animated with Reanimated, backdrop blur
- [x] Upgrade ProgressBar — Animated fill with `withTiming`
- [x] Upgrade EmptyState — Fade-in animation
- [x] Create MetricCard — Icon + value + label + trend arrow
- [x] Create ErrorFallback — Per-screen "Something went wrong" + retry
- [x] Create PageHeader — Back + title + actions
- [x] Create SectionHeader — Title + optional "See All"
- [x] Create CollapsibleSection — Expand/collapse with Reanimated
- [x] Create LoadingCard — Skeleton card for lists

### Phase 1: Garden Immersive Overhaul [x] Complete
- [x] Create GardenViewport — Full-width 60% viewport with layer system
- [x] Create EnvironmentEffects — Skia weather (rain, sun, clouds, night, storm)
- [x] Create FloatingActionButton — 3 FABs (Scan, Water, Soil) with spring animation
- [x] Create PlantHealthBadge — Color-coded dot+label per crop (healthy/dry/sick/growing)
- [x] Create SyncWidget — IoT sensor card (online/offline, moisture, humidity, temp, last sync)
- [x] Create XpBar — Compact animated progress bar
- [x] Create StreakDisplay — Fire pill animated badge
- [x] Delete GrowthOverlay.tsx (774 lines) — replaced by compact HUD
- [x] Rewrite GardenScreen (1317→~650 lines) — immersive layout, compact HUD, collapsible sections

### Phase 2: Marketplace Redesign [ ] Pending
- [ ] Create ProductCard — Image (emoji fallback), title, price, seller, badge, Buy button
- [ ] Create ProductCardHorizontal — Horizontal variant for featured/trending
- [ ] Create FeaturedRow — Horizontal scroll section with header
- [ ] Create TrendingRow — Same, "Trending 🔥" header
- [ ] Create BuyModal — Confirmation + quantity + coupon + confetti
- [ ] Create CategoryChip — Styled chip matching tokens
- [ ] Create SearchBar — Debounced 300ms, clear button, focus animation
- [ ] Create ListingSkeleton — Card skeleton for marketplace
- [ ] Create EmptyMarketplace — Illustration + message + CTA
- [ ] Rewrite MarketplaceScreen — SearchBar → CategoryChips → FeaturedRow → TrendingRow → ProductCard FlatList

### Phase 3: Community Redesign [ ] Pending
- [ ] Create NearbyGardenerCard — Avatar, username, level, location, score, Follow
- [ ] Create LeaderboardCard — Rank badges (#1 gold, #2 silver, #3 bronze), staggered entry
- [ ] Create CommunityGroupCard — Image/fallback, name, member count, Join button
- [ ] Create EventCard — Title, date, rewards, Participate button
- [ ] Create ActivityFeed — Icon + text + timestamp list
- [ ] Create CommunitySearchBar — Debounced search
- [ ] Rewrite CommunityScreen — Segmented control + all new cards

### Phase 4: State Management & Performance [ ] Pending
- [ ] React Query migration for all API calls
- [ ] Configure query staleTime/gcTime per domain
- [ ] FlashList for marketplace and community lists
- [ ] React.memo on card components
- [ ] Lazy-load Garden3D (dynamic import for 3D mode)
- [ ] expo-image with memory-disk caching

### Phase 5: Polish [ ] Pending
- [ ] Per-screen ErrorBoundary
- [ ] Staggered card entrance animations
- [ ] Offline banner + stale cache display
- [ ] Verify Avatar never shows raw URLs
- [ ] Path alias migration (@/ → src/)