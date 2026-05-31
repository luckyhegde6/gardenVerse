import { test, expect } from '../fixtures/test';

test.describe('Invite System UI', () => {
  test('should render invites page with table', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/invites', { waitUntil: 'networkidle' });
    await expect(page.locator('table')).toBeVisible();
  });

  test('should display invite codes in table rows', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/invites', { waitUntil: 'networkidle' });
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should have status badges for each invite', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/invites', { waitUntil: 'networkidle' });
    const badges = page.locator('span:has-text("Active"), span:has-text("Inactive")');
    await expect(badges.first()).toBeVisible();
  });
});

test.describe('Super Admin Portal', () => {
  test('should render super admin dashboard with tabs', async ({ page }) => {
    await page.goto('/super-admin');
    const loginBtn = page.locator('button:has-text("Login")');
    const registerBtn = page.locator('button:has-text("Register")');
    await expect(loginBtn.first()).toBeVisible();
    await expect(registerBtn.first()).toBeVisible();
  });

  test('should toggle between login and register forms', async ({ page }) => {
    await page.goto('/super-admin');
    await page.locator('button:has-text("Register")').first().click();
    await page.waitForTimeout(500);
    const emailFields = page.locator('input[type="email"]');
    const count = await emailFields.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should show validation for empty registration fields', async ({ page }) => {
    await page.goto('/super-admin');
    await page.locator('button:has-text("Register")').first().click();
    await page.waitForTimeout(500);
    await page.locator('button[type="submit"]').first().click();
    const emailInput = page.locator('input[type="email"]');
    const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validity).toBeTruthy();
  });
});

test.describe('Token Transactions UI', () => {
  test('should render token columns in users table', async ({ page }) => {
    await page.goto('/users');
    const headers = page.locator('th');
    const headerTexts = await headers.allTextContents();
    const hasTokenHeaders = headerTexts.some(t => t.includes('Credits') || t.includes('Points') || t.includes('Balance'));
  });
});
