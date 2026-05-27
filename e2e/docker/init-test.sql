-- ============================================================
-- GardenVerse Test Database Initialization
-- Temp tables + seed data for E2E testing
-- ============================================================

-- Create test schema
CREATE SCHEMA IF NOT EXISTS test;

-- Temp table: test users
CREATE TEMP TABLE IF NOT EXISTS temp_test_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER',
  is_verified BOOLEAN DEFAULT TRUE,
  green_credits DECIMAL DEFAULT 1000,
  eco_points DECIMAL DEFAULT 500,
  reputation_tokens DECIMAL DEFAULT 100,
  trust_score DECIMAL DEFAULT 100
);

-- Temp table: test invites
CREATE TEMP TABLE IF NOT EXISTS temp_test_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT DEFAULT 'CODE',
  max_uses INT DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_by_id UUID
);

-- Temp table: test transactions
CREATE TEMP TABLE IF NOT EXISTS temp_test_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  action TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed a super admin user (password: Test@12345678)
INSERT INTO temp_test_users (email, username, display_name, password_hash, role)
VALUES (
  'admin@gardenverse.test',
  'test_admin',
  'Test Admin',
  '$2b$12$LJ3m4ys3Lg3YOCwKkPOKYe5Lx0qJ0v0a0b0c0d0e0f0g0h0i0j0k0l0m0n',
  'SUPER_ADMIN'
);

-- Seed a regular user
INSERT INTO temp_test_users (email, username, display_name, password_hash, role)
VALUES (
  'user@gardenverse.test',
  'test_user',
  'Test User',
  '$2b$12$LJ3m4ys3Lg3YOCwKkPOKYe5Lx0qJ0v0a0b0c0d0e0f0g0h0i0j0k0l0m0n',
  'USER'
);

-- Seed test invites
INSERT INTO temp_test_invites (code, type, max_uses, created_by_id)
VALUES
  ('TESTCODE01', 'CODE', 5, (SELECT id FROM temp_test_users WHERE email = 'admin@gardenverse.test' LIMIT 1)),
  ('TESTPASS01', 'PASSCODE', 3, (SELECT id FROM temp_test_users WHERE email = 'admin@gardenverse.test' LIMIT 1)),
  ('TESTQR01', 'QR', 1, (SELECT id FROM temp_test_users WHERE email = 'admin@gardenverse.test' LIMIT 1));

-- Seed test transactions
INSERT INTO temp_test_transactions (type, amount, action, user_id)
VALUES
  ('GREEN_CREDITS', 500, 'PURCHASE', (SELECT id FROM temp_test_users WHERE email = 'user@gardenverse.test' LIMIT 1)),
  ('ECO_POINTS', 100, 'GARDEN_ACTIVITY', (SELECT id FROM temp_test_users WHERE email = 'user@gardenverse.test' LIMIT 1)),
  ('REPUTATION_TOKENS', 50, 'TRADE_COMPLETE', (SELECT id FROM temp_test_users WHERE email = 'user@gardenverse.test' LIMIT 1));
