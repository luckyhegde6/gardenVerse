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

### Mobile App — Garden Screen Enhancement (Phase 1.5)
**Goal: Transform GardenScreen into a playable, juicy game loop**

- [x] **1.5.1** Guided first plant: pulse hint on empty plot + seed selection bottom sheet
  - [x] PlantSelectionSheet with seed carousel
  - [x] Pulsing hint on center empty plot (IsometricGrid)
  - [x] Wire starter seed grant in GardenScreen mount effect
- [x] **1.5.2** Action feedback: haptics + Skia particles + sound for water/fertilize/harvest
  - [x] ParticlePresets, useParticles, ParticleSystem (Skia)
  - [x] useGameFeedback hook (haptics + sound + particles)
  - [x] Wire into AnimatedActionButton, WaterButton, FertilizeButton, HarvestButton
  - [x] Add placeholder sound assets (assets/sounds/*.wav)
- [x] **1.5.3** 3D view interaction parity: raycast plant selection in Garden3D
- [x] **1.5.4** Empty state gamification: starter seeds + animated plot hints
- [x] **1.5.5** Growth tick visual pulse: subtle animation on all growing crops
- [x] **1.5.6** Daily quest tracker widget on garden header
- [x] **1.5.7** E2E tests for plant→water→harvest loop, 2D/3D toggle, quest widget
- [x] Build debug APK and test on emulator
- [x] Document learnings in AGENTS.md

## Phase 2: Progression & Retention (Week 2-3)
- [ ] **2.1** XP floating numbers + level-up celebration modal
- [ ] **2.2** Crop detail modal on long-press (growth timeline, care history, predicted harvest)
- [ ] **2.3** Daily quest integration on garden header
- [ ] **2.4** Sound asset creation (plant, water, fertilize, harvest, levelup)
- [ ] **2.5** Starter seed grant API integration

## Phase 3: Polish & Depth (Week 3-4)
- [ ] **3.1** Seasonal garden themes (background, soil color, ambient particles)
- [ ] **3.2** Weather particle effects (rain, snow, heat shimmer)
- [ ] **3.3** Drag-to-water-multiple gesture
- [ ] **3.4** Garden layout save/load templates
- [ ] **3.5** Friend garden preview in plot selector

## Phase 4: Social & Competitive (Week 4-5)
- [ ] **4.1** Garden visit + rating feature
- [ ] **4.2** Weekly "Best Garden" contest banner
- [ ] **4.3** Social sharing (auto-generated garden cards)