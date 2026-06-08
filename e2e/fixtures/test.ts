import { test as base, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3000';
const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || DEFAULT_PASSWORD;

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; role: string };
}

export async function loginAs(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${API_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return {
    accessToken: data.token,
    refreshToken: data.refreshToken,
    user: { id: data.id, email: data.email, role: data.role },
  };
}

export async function setupAuthPage(
  page: Page,
  session: AuthSession,
): Promise<void> {
  const userInfo = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.email,
    role: session.user.role,
  };
  await page.goto(`${ADMIN_URL}/login`);
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
  }, { token: session.accessToken, user: userInfo });
  await page.reload();
  await page.waitForLoadState('networkidle');
  // Confirm auth worked by navigating to dashboard
  await page.goto(`${ADMIN_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForSelector('nav', { timeout: 10000 }).catch(() => {});
}

export interface TestFixtures {
  apiUrl: string;
  adminUrl: string;
  authenticatedPage: Page;
  superAdminPage: Page;
}

export const test = base.extend<TestFixtures>({
  apiUrl: API_URL,
  adminUrl: ADMIN_URL,

  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    try {
      const session = await loginAs('admin@gardenverse.vercel.app', DEFAULT_PASSWORD);
      await setupAuthPage(page, session);
    } catch {
      // Fallback: navigate to login page
      await page.goto(`${ADMIN_URL}/login`);
    }
    await use(page);
    await context.close();
  },

  superAdminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    try {
      const session = await loginAs('admin@gardenverse.vercel.app', DEFAULT_PASSWORD);
      await setupAuthPage(page, session);
    } catch {
      await page.goto(`${ADMIN_URL}/login`);
    }
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
