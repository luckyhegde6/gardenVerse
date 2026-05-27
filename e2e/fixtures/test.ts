import { test as base, type Page, type BrowserContext } from '@playwright/test';
import path from 'path';

const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3000';

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
    await use(page);
    await context.close();
  },

  superAdminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto(`${ADMIN_URL}/api/auth/csrf`);
    await page.evaluate(() => {
      document.cookie = 'access_token=demo-super-admin-token; path=/; SameSite=Strict';
    });
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
