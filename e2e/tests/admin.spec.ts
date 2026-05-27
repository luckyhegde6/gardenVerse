import { test, expect } from '../fixtures/test';

test.describe('Admin Dashboard', () => {
  test('should render dashboard page with stat cards', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('.card')).toHaveCount(1);
  });

  test('should navigate sidebar links', async ({ page }) => {
    await page.goto('/dashboard');
    const navLinks = page.locator('nav a');
    const linksCount = await navLinks.count();
    expect(linksCount).toBeGreaterThan(0);
  });

  test('should load users page', async ({ page }) => {
    await page.goto('/users');
    await expect(page).toHaveURL(/users/);
  });

  test('should load moderation page', async ({ page }) => {
    await page.goto('/moderation');
    await expect(page).toHaveURL(/moderation/);
  });

  test('should load marketplace page', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(page).toHaveURL(/marketplace/);
  });

  test('should load invites page', async ({ page }) => {
    await page.goto('/invites');
    await expect(page).toHaveURL(/invites/);
  });

  test('should load campaigns page', async ({ page }) => {
    await page.goto('/campaigns');
    await expect(page).toHaveURL(/campaigns/);
  });

  test('should load features page', async ({ page }) => {
    await page.goto('/features');
    await expect(page).toHaveURL(/features/);
  });
});

test.describe('Admin Data Table', () => {
  test('should display data with sortable columns', async ({ page }) => {
    await page.goto('/users');
    const sortableHeaders = page.locator('th:has(svg)');
    const count = await sortableHeaders.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should have search input on list pages', async ({ page }) => {
    await page.goto('/users');
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });
});
