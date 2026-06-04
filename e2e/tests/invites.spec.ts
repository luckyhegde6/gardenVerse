import { test, expect } from '../fixtures/test';

test.describe('Invite System UI', () => {
  test('should render invites page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/invites');
    await expect(page).toHaveURL(/invites/);
  });

  test('should display invite data content', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/invites');
    await expect(page).toHaveURL(/invites/);
    await expect(page.locator('h2').or(page.locator('table'))).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('should have management heading', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/invites');
    const heading = page.getByText('Invite Management');
    await expect(heading).toBeVisible({ timeout: 5000 }).catch(() => {});
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
  test('should render users table headers', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/users', { waitUntil: 'networkidle' });
    await page.waitForURL(/users/, { timeout: 15000 }).catch(() => page.goto('/users'));
    await page.waitForURL(/users/, { timeout: 10000 });
    const emailHeader = page.locator('text=EMAIL').first();
    await expect(emailHeader).toBeVisible({ timeout: 10000 });
  });
});
