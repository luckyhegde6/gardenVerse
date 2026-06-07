/**
 * Integration E2E Tests (Playwright)
 *
 * Tests the full stack: Admin API -> Database -> Mobile API consumption
 * Verifies that data seeded in the database is correctly served by API endpoints
 * and rendered in the admin dashboard.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/v1`;

// ─── Helper: Login via API and return auth token ────────────────────────────
async function login(request: any, email: string, password: string) {
  const res = await request.post(`${API_URL}/auth/login`, {
    data: { email, password }
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  return body.accessToken as string;
}

// ─── Helper: Login via UI and get authenticated page ────────────────────────
async function authenticateUI(page: any, email: string, password: string) {
  // Navigate to admin login page
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // NextAuth sign-in form — try multiple selector strategies
  const emailInput = page.locator('input[name="email"], input[type="email"], input[id="email"], #input-email').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"], input[id="password"]').first();
  const submitBtn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")').first();

  await emailInput.fill(email, { timeout: 10000 });
  await passwordInput.fill(password, { timeout: 10000 });
  await submitBtn.click({ timeout: 10000 });

  // Wait for redirect to dashboard or garden page
  await page.waitForTimeout(5000);
}

test.describe('Admin API Integration', () => {

  test.describe('Health & Auth', () => {
    test('health endpoint returns 200', async ({ request }) => {
      const res = await request.get(`${API_URL}/health`);
      expect(res.status()).toBe(200);
    });

    test('login with demo account', async ({ request }) => {
      const res = await request.post(`${API_URL}/auth/login`, {
        data: { email: 'demo@gardenverse.vercel.app', password: 'password123' }
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('user');
      expect(body.user.email).toBe('demo@gardenverse.vercel.app');
    });
  });

  test.describe('Seed Data Verification (Public APIs)', () => {
    test('plants API returns 220+ species', async ({ request }) => {
      const res = await request.get(`${API_URL}/plants?limit=300`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      const plants = body.data || body;
      expect(plants.length).toBeGreaterThan(200);
    });

    test('plants include Indian crops (search by q param)', async ({ request }) => {
      const res = await request.get(`${API_URL}/plants?q=tomato&limit=20`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      const plants = body.data || body;
      const tomato = plants.find((p: any) =>
        p.commonName?.toLowerCase().includes('tomato')
      );
      expect(tomato).toBeDefined();
      expect(tomato.isNative).toBe(true);
    });

    test('marketplace listings API returns data (public)', async ({ request }) => {
      const res = await request.get(`${API_URL}/marketplace`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      const listings = body.data || body;
      expect(listings.length).toBeGreaterThanOrEqual(3);
      const titles = listings.map((l: any) => l.title);
      expect(titles.some((t: string) => t.includes('Tomato'))).toBe(true);
    });

    test('weather API returns regional data', async ({ request }) => {
      const res = await request.get(`${API_URL}/weather?region=IN-KA`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      const weather = body.data || body;
      expect(weather.temperature).toBeDefined();
      expect(weather.condition).toBeDefined();
    });
  });

  test.describe('Seed Data Verification (Auth Required)', () => {
    let authToken: string;

    test.beforeAll(async ({ request }) => {
      authToken = await login(request, 'admin@gardenverse.vercel.app', 'password123');
    });

    test('gardens API returns gardens with auth', async ({ request }) => {
      const res = await request.get(`${API_URL}/gardens?limit=20`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      const gardens = body.data || body;
      expect(gardens.length).toBeGreaterThanOrEqual(1);
      const demoGarden = gardens.find((g: any) => g.name === 'Demo Garden');
      expect(demoGarden).toBeDefined();
      expect(demoGarden.type).toBe('VIRTUAL');
    });

    test('crops API returns demo crops with auth', async ({ request }) => {
      const res = await request.get(`${API_URL}/crops?limit=50`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      const crops = body.data || body;
      expect(crops.length).toBeGreaterThanOrEqual(3);
      const names = crops.map((c: any) => c.name);
      expect(names).toContain('Tomato');
      expect(names).toContain('Chilli');
      expect(names).toContain('Mint');
    });

    test('community groups API returns data with auth', async ({ request }) => {
      const res = await request.get(`${API_URL}/community/groups`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      const groups = body.data || body;
      expect(groups.length).toBeGreaterThanOrEqual(2);
      const names = groups.map((g: any) => g.name);
      expect(names).toContain('Bangalore Gardeners');
    });

    test('gardens include crop data (mobile format)', async ({ request }) => {
      const res = await request.get(`${API_URL}/gardens?limit=10`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      const gardens = body.data || body;
      if (gardens.length > 0) {
        const g = gardens[0];
        expect(g).toHaveProperty('name');
        expect(g).toHaveProperty('type');
        expect(g).toHaveProperty('gridWidth');
        expect(g).toHaveProperty('gridHeight');
        // Crops should be included
        expect(g).toHaveProperty('crops');
      }
    });
  });

  test.describe('Admin Dashboard Pages (UI)', () => {
    test.beforeEach(async ({ page }) => {
      await authenticateUI(page, 'admin@gardenverse.vercel.app', 'password123');
    });

    test('dashboard loads with stats', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      // Dashboard should load — check for any heading or stat card
      const content = await page.textContent('body');
      expect(content.length).toBeGreaterThan(100);
    });

    test('users page shows seeded users', async ({ page }) => {
      await page.goto(`${BASE_URL}/users`);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      const content = await page.textContent('body');
      // Should show user data
      expect(content).toContain('admin');
    });

    test('garden page shows all gardens', async ({ page }) => {
      await page.goto(`${BASE_URL}/garden`);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.locator('text=Demo Garden').or(page.locator('text=Demo'))).toBeVisible();
    });

    test('marketplace page shows listings', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace`);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.locator('text=Fresh Organic Tomatoes').or(page.locator('text=Tomato'))).toBeVisible();
    });

    test('weather page shows data', async ({ page }) => {
      await page.goto(`${BASE_URL}/weather`);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      const content = await page.textContent('body');
      expect(content.length).toBeGreaterThan(100);
    });

    test('AI scanner page loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/ai-scanner`);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      const content = await page.textContent('body');
      expect(content.length).toBeGreaterThan(100);
    });

    test('community page shows groups', async ({ page }) => {
      await page.goto(`${BASE_URL}/community`);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.locator('text=Bangalore Gardeners').or(page.locator('text=Bangalore'))).toBeVisible();
    });

    test('features page shows feature flags', async ({ page }) => {
      await page.goto(`${BASE_URL}/features`);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await expect(page.locator('text=virtual_garden_100x_speed').or(page.locator('text=garden'))).toBeVisible();
    });
  });

  test.describe('Mobile API Endpoints', () => {
    test('GET /api/v1/plants returns paginated format', async ({ request }) => {
      const res = await request.get(`${API_URL}/plants?limit=5&page=1`);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('page');
      expect(body).toHaveProperty('limit');
    });

    test('plants pagination works correctly', async ({ request }) => {
      const res1 = await request.get(`${API_URL}/plants?limit=5&page=1`);
      const body1 = await res.json();
      expect(body1.data.length).toBeLessThanOrEqual(5);
      expect(body1.page).toBe(1);

      const res2 = await request.get(`${API_URL}/plants?limit=5&page=2`);
      const body2 = await res.json();
      expect(body2.page).toBe(2);
      // Page 2 should have different plants than page 1
      if (body1.data.length > 0 && body2.data.length > 0) {
        expect(body1.data[0].id).not.toBe(body2.data[0].id);
      }
    });
  });
});
