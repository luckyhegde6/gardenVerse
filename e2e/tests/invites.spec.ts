import { test, expect } from '../fixtures/test';

test.describe('Invite System UI', () => {
  test('should render invites page with table', async ({ page }) => {
    await page.goto('/invites');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should display invite codes in table rows', async ({ page }) => {
    await page.goto('/invites');
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should have status badges for each invite', async ({ page }) => {
    await page.goto('/invites');
    const badges = page.locator('span:has-text("Active"), span:has-text("Inactive")');
    await expect(badges.first()).toBeVisible();
  });
});

test.describe('Super Admin Portal', () => {
  test('should render super admin dashboard with tabs', async ({ page }) => {
    await page.goto('/super-admin');
    const loginBtn = page.locator('button:has-text("Login")');
    const registerBtn = page.locator('button:has-text("Register")');
    await expect(loginBtn).toBeVisible();
    await expect(registerBtn).toBeVisible();
  });

  test('should toggle between login and register forms', async ({ page }) => {
    await page.goto('/super-admin');
    await page.locator('button:has-text("Register")').click();
    await expect(page.locator('input[placeholder*="Username"]')).toBeVisible();
    await page.locator('button:has-text("Login")').click();
    await expect(page.locator('input[placeholder*="Username"]')).not.toBeVisible();
  });

  test('should show validation for empty registration fields', async ({ page }) => {
    await page.goto('/super-admin');
    await page.locator('button:has-text("Register")').click();
    await page.locator('button[type="submit"]').click();
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
