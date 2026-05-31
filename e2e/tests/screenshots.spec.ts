import { test, expect } from '../fixtures/test';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'screenshots');

async function screenshotPage(page, workflow: string, stepName: string, num: number) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  const dir = path.join(SCREENSHOT_DIR, workflow);
  const { mkdirSync } = await import('fs');
  mkdirSync(dir, { recursive: true });
  const padded = String(num).padStart(2, '0');
  await page.screenshot({ path: path.join(dir, `${padded}-${stepName}.png`), fullPage: true });
}

async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@gardenverse.vercel.app');
  await page.fill('input[type="password"]', 'Password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

// Auth workflow — unauthenticated, shows login/register flows
test.describe('auth', () => {
  const steps = ['/login', '/login?filled=1', '/super-admin', '/super-admin?register=1', '/dashboard'];
  for (let i = 0; i < steps.length; i++) {
    const stepName = steps[i].replace(/[/?=&]/g, '-').replace(/^-+/, '') || 'root';
    test(`screenshot ${stepName}`, async ({ page }) => {
      await page.goto(steps[i]);
      await screenshotPage(page, 'auth', stepName, i + 1);
    });
  }
});

// Garden workflow — requires auth
test.describe('garden', () => {
  test.use({ storageState: undefined });
  const steps = ['/garden', '/garden/plant', '/plants', '/garden/crop/demo'];
  for (let i = 0; i < steps.length; i++) {
    const stepName = steps[i].replace(/[/?=&]/g, '-').replace(/^-+/, '') || 'root';
    test(`screenshot ${stepName}`, async ({ page }) => {
      if (i === 0) await loginAsAdmin(page);
      await page.goto(steps[i]);
      await screenshotPage(page, 'garden', stepName, i + 1);
    });
  }
});

// Admin portal — requires auth
test.describe('admin', () => {
  test.use({ storageState: undefined });
  const steps = ['/dashboard', '/users', '/marketplace', '/invites', '/super-admin/dashboard'];
  for (let i = 0; i < steps.length; i++) {
    const stepName = steps[i].replace(/[/?=&]/g, '-').replace(/^-+/, '') || 'root';
    test(`screenshot ${stepName}`, async ({ page }) => {
      if (i === 0) await loginAsAdmin(page);
      await page.goto(steps[i]);
      await screenshotPage(page, 'admin', stepName, i + 1);
    });
  }
});

// Weather — requires auth
test.describe('weather', () => {
  test.use({ storageState: undefined });
  test(`screenshot weather`, async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/weather');
    await screenshotPage(page, 'weather', 'weather', 1);
  });
});

// Marketplace — requires auth
test.describe('marketplace', () => {
  test.use({ storageState: undefined });
  const steps = ['/marketplace', '/marketplace/create'];
  for (let i = 0; i < steps.length; i++) {
    const stepName = steps[i].replace(/[/?=&]/g, '-').replace(/^-+/, '') || 'root';
    test(`screenshot ${stepName}`, async ({ page }) => {
      if (i === 0) await loginAsAdmin(page);
      await page.goto(steps[i]);
      await screenshotPage(page, 'marketplace', stepName, i + 1);
    });
  }
});

// Community — requires auth
test.describe('community', () => {
  test.use({ storageState: undefined });
  const steps = ['/community', '/community/groups'];
  for (let i = 0; i < steps.length; i++) {
    const stepName = steps[i].replace(/[/?=&]/g, '-').replace(/^-+/, '') || 'root';
    test(`screenshot ${stepName}`, async ({ page }) => {
      if (i === 0) await loginAsAdmin(page);
      await page.goto(steps[i]);
      await screenshotPage(page, 'community', stepName, i + 1);
    });
  }
});

// AI Scanner — requires auth
test.describe('ai-scanner', () => {
  test.use({ storageState: undefined });
  const steps = ['/ai-scanner', '/ai-scanner/history'];
  for (let i = 0; i < steps.length; i++) {
    const stepName = steps[i].replace(/[/?=&]/g, '-').replace(/^-+/, '') || 'root';
    test(`screenshot ${stepName}`, async ({ page }) => {
      if (i === 0) await loginAsAdmin(page);
      await page.goto(steps[i]);
      await screenshotPage(page, 'ai-scanner', stepName, i + 1);
    });
  }
});

// Invites — requires auth
test.describe('invites', () => {
  test.use({ storageState: undefined });
  const steps = ['/invites', '/invites/create'];
  for (let i = 0; i < steps.length; i++) {
    const stepName = steps[i].replace(/[/?=&]/g, '-').replace(/^-+/, '') || 'root';
    test(`screenshot ${stepName}`, async ({ page }) => {
      if (i === 0) await loginAsAdmin(page);
      await page.goto(steps[i]);
      await screenshotPage(page, 'invites', stepName, i + 1);
    });
  }
});

// Gamification — requires auth
test.describe('gamification', () => {
  test.use({ storageState: undefined });
  test(`screenshot gamification`, async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/gamification');
    await screenshotPage(page, 'gamification', 'gamification', 1);
  });
});
