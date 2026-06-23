# Migration Runbook — GardenVerse Admin Schema

## Purpose
This file documents the missing named migrations for the admin PostgreSQL schema so every environment can be provisioned with `prisma migrate` instead of relying on `prisma db push`.

## Expected Migration Files
Each entry below corresponds to a file under `packages/admin/prisma/migrations/`.

### `migrations/<timestamp>_plant_gallery/migration.sql`
Backfill `PlantSpecies` gallery seed data and related lookup indexes used by the admin plant browser and mobile plant selection flows.

### `migrations/<timestamp>_fix_user_id/migration.sql`
Align `User.id` handling with the agreed UUID identity strategy, including any required index or constraint adjustments.

### `migrations/<timestamp>_fix_id_types/migration.sql`
Normalize ID column types across tables so all primary and foreign keys use matching UUID representations.

## How to Apply
```bash
cd packages/admin
npx prisma migrate deploy
```

## Operational Notes
- Stop the admin dev server before applying migrations to avoid query-engine lock conflicts.
- If migrations fail on an existing database, use `prisma migrate resolve` to mark them applied after validating the schema state.
