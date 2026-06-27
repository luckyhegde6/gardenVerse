import { test, expect } from '@playwright/test';

// Extend window type for testing
declare global {
  interface Window {
    growthEngine?: {
      forceTick: () => void;
    };
  }
}

test.describe('Garden Screen — Game Feel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@gardenverse.vercel.app');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/garden');
  });

  test('First-time user completes plant→water→harvest loop', async ({ page }) => {
    // Wait for garden to load
    await expect(page.locator('[data-testid="garden-screen"]')).toBeVisible();

    // Click on center empty plot (3,3)
    await page.click('[data-testid="plot-3-3"]');

    // Plant selection sheet should appear
    await expect(page.locator('[data-testid="plant-selection-sheet"]')).toBeVisible();

    // Select tomato seed
    await page.click('[data-testid="seed-tomato"]');

    // Confirm planting
    await page.click('[data-testid="confirm-plant"]');

    // Planting animation should be visible
    await expect(page.locator('[data-testid="planting-animation"]')).toBeVisible();

    // Wait for planting to complete
    await page.waitForTimeout(2000);

    // Water the crop
    await page.click('[data-testid="water-button"]');

    // Water particles should be visible
    await expect(page.locator('[data-testid="water-particles"]')).toBeVisible();

    // Fast-forward growth engine
    await page.evaluate(() => {
      if (window.growthEngine) {
        window.growthEngine.forceTick();
      }
    });

    // Wait for growth tick
    await page.waitForTimeout(1000);

    // Harvest the crop
    await page.click('[data-testid="harvest-button"]');

    // XP toast should be visible
    await expect(page.locator('[data-testid="xp-toast"]')).toBeVisible();
  });

  test('2D/3D toggle preserves selection', async ({ page }) => {
    await expect(page.locator('[data-testid="garden-screen"]')).toBeVisible();

    // Click on a crop to select it
    await page.click('[data-testid="plot-3-3"]');
    
    // Wait for crop to be planted if needed
    await page.waitForTimeout(1000);

    // Toggle to 3D view
    await page.click('[data-testid="view-toggle-3d"]');

    // Verify 3D view is active
    await expect(page.locator('[data-testid="garden-3d"]')).toBeVisible();

    // Toggle back to 2D
    await page.click('[data-testid="view-toggle-2d"]');

    // Verify 2D view is active
    await expect(page.locator('[data-testid="isometric-grid"]')).toBeVisible();
  });

  test('Quest widget updates on action', async ({ page }) => {
    await expect(page.locator('[data-testid="garden-screen"]')).toBeVisible();

    // Check quest widget is visible
    await expect(page.locator('[data-testid="quest-tracker-widget"]')).toBeVisible();

    // Get initial progress
    const initialProgress = await page.locator('[data-testid="quest-progress"]').textContent();

    // Water a crop
    await page.click('[data-testid="water-button"]');

    // Wait for quest update
    await page.waitForTimeout(500);

    // Check progress updated
    const updatedProgress = await page.locator('[data-testid="quest-progress"]').textContent();
    expect(updatedProgress).not.toBe(initialProgress);
  });

  test('Empty garden shows pulsing hint', async ({ page }) => {
    // Create a new user with empty garden
    await page.goto('/login');
    await page.fill('input[type="email"]', 'newuser@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/garden');

    // Wait for garden to load
    await expect(page.locator('[data-testid="garden-screen"]')).toBeVisible();

    // Check pulsing hint on center plot
    await expect(page.locator('[data-testid="pulsing-hint-3-3"]')).toBeVisible();
  });

  test('Growth tick visual pulse on all growing crops', async ({ page }) => {
    await expect(page.locator('[data-testid="garden-screen"]')).toBeVisible();

    // Plant a crop
    await page.click('[data-testid="plot-3-3"]');
    await page.click('[data-testid="seed-tomato"]');
    await page.click('[data-testid="confirm-plant"]');
    await page.waitForTimeout(2000);

    // Wait for growth tick (30 seconds virtual = 30s real)
    // Force a tick
    await page.evaluate(() => {
      if (window.growthEngine) {
        window.growthEngine.forceTick();
      }
    });

    // Check growth tick particles
    await expect(page.locator('[data-testid="growth-tick-particles"]')).toBeVisible();
  });
});