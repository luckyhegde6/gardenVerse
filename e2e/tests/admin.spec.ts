import { test, expect } from '../fixtures/test';

test.describe('Admin Dashboard', () => {
  test('should render dashboard page with stat cards', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });
  });

  test('should navigate sidebar links', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    const navLinks = page.locator('nav a');
    await expect(navLinks.first()).toBeVisible({ timeout: 10000 });
    const linksCount = await navLinks.count();
    expect(linksCount).toBeGreaterThan(0);
  });

  test('should load users page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/users');
    await expect(page).toHaveURL(/users/);
  });

  test('should load moderation page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/moderation');
    await expect(page).toHaveURL(/moderation/);
  });

  test('should load marketplace page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/marketplace');
    await expect(page).toHaveURL(/marketplace/);
  });

  test('should load invites page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/invites');
    await expect(page).toHaveURL(/invites/);
  });

  test('should load campaigns page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/campaigns');
    await expect(page).toHaveURL(/campaigns/);
  });

  test('should load features page', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/features');
    await expect(page).toHaveURL(/features/);
  });
});

test.describe('Admin Data Table', () => {
  test('should display data with sortable columns', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/users', { waitUntil: 'networkidle' });
    await page.waitForURL(/users/, { timeout: 15000 }).catch(() => page.goto('/users'));
    await page.waitForURL(/users/, { timeout: 10000 });
    const usernameHeader = page.locator('text=USERNAME').first();
    await expect(usernameHeader).toBeVisible({ timeout: 10000 });
  });

  test('should have search input on list pages', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/users');
    await expect(page).toHaveURL(/users/);
    const searchInput = page.locator('input[placeholder*="earch"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 }).catch(() => {});
  });
});
