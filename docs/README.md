# GardenVerse Documentation

**Last Updated:** 2026-06-08

---

## 📚 Documentation Index

### Getting Started
- [Local Development & Testing Guide](guides/local-development.md) — Quick start, infrastructure setup, running services, testing, troubleshooting

### Deployment
- [Vercel Deployment Guide](deployment/vercel-deployment.md) — Production deployment for Admin Dashboard + API
- [APK Build & Publish Guide](deployment/apk-publishing.md) — Android build, signing, Google Play Store submission

### Mobile Testing
- [Android Emulator E2E Testing](mobile/emulator-testing.md) — Detox test suite, emulator setup, test runner, troubleshooting

### Workflow & Process
- [Production Sync Guide](guides/production-sync.md) — Git workflow, DB migrations, env var sync, rollback procedures

### Changelog
- [Phase A Implementation Changelog](guides/phase-a-changelog.md) — Complete record of Phase A changes (seed data, migration, E2E tests, weather integration)

---

## 🏗️ Architecture Overview

```
┌──────────────┐   ┌──────────────────────┐   ┌──────────────┐
│  React Native│   │  Next.js 14          │   │  IoT Devices │
│  (Mobile)    │   │  (Admin UI + API)    │   │  (ESP32)     │
└──────┬───────┘   └──────┬───────────────┘   └──────┬───────┘
       │                  │                          │
       └──────────────────┼──────────────────────────┘
                          │
                 ┌────────▼────────┐
                 │   PostgreSQL    │
                 │   (Supabase)    │
                 └────────┬────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │  Upstash │    │ FastAPI  │    │  BullMQ  │
     │  Redis   │    │ (AI Svc) │    │ (Worker) │
     └──────────┘    └──────────┘    └──────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Admin UI | Next.js 14, TailwindCSS, Radix UI, Recharts |
| API | Next.js 14 App Router (71 routes, 29 modules) |
| Database | PostgreSQL 16 (Supabase), Prisma ORM 5 |
| Cache | Redis 7 (Upstash for serverless) |
| Mobile | React Native 0.74, Expo 51, NativeWind, React Navigation |
| State | Zustand (mobile), React Query |
| Auth | NextAuth (admin), JWT (mobile) |
| AI | FastAPI, OpenCV, PyTorch |
| IoT | MQTT, Mosquitto, ESP32 |
| Testing | Playwright (admin), Detox (mobile), Jest (unit) |
| CI/CD | GitHub Actions, Vercel, EAS Build |
| Monitoring | Sentry, Prometheus, Grafana |

---

## 🚀 Quick Commands

```bash
# Development
npm run admin:dev          # Admin dashboard + API → :3000
npm run mobile:dev         # Expo mobile app
npm run docker:local       # Postgres + Redis

# Database
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:seed        # Seed demo data
npm run prisma:studio      # Database GUI → :5555

# Testing
npm run test               # Unit tests
npm run test:e2e:integration   # Playwright integration
npm run test:e2e:mobile    # Detox mobile E2E

# Deployment
npm run deploy:preview     # Vercel preview
npm run deploy:prod        # Vercel production

# Type Checking
npm run typecheck          # All packages
npm run typecheck:admin    # Admin only
npm run typecheck:mobile   # Mobile only
```

---

## 📁 Key Directories

| Path | Purpose |
|------|---------|
| `packages/admin/src/app/api/v1/` | 71 API routes across 29 modules |
| `packages/admin/src/app/` | 31 admin dashboard UI pages |
| `packages/admin/prisma/schema.prisma` | Database schema (42+ models, 9 enums) |
| `packages/mobile/src/screens/` | 32+ mobile screens |
| `packages/mobile/src/stores/` | Zustand state management |
| `services/ai/src/` | FastAPI AI service endpoints |
| `e2e/tests/` | Playwright integration tests |
| `e2e/mobile/` | Detox mobile E2E tests |
| `docs/` | This documentation |

---

## 🔑 Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@gardenverse.vercel.app` | `password123` | Admin |
| `superadmin@gardenverse.vercel.app` | `password123` | Super Admin |
| `demo@gardenverse.vercel.app` | `password123` | Demo User |

---

## 📖 External Documentation

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma ORM Docs](https://www.prisma.io/docs)
- [Detox E2E Testing](https://wix.github.io/Detox/)
- [Playwright Testing](https://playwright.dev/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Supabase Docs](https://supabase.com/docs)
- [Upstash Redis](https://docs.upstash.com/)
- [Vercel Docs](https://vercel.com/docs)
