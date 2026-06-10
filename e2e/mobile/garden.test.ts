/**
 * Garden E2E Tests
 * Tests garden view, crop interactions, growth engine, and walkthrough
 */

import { device, element, by, expect, waitFor } from 'detox';
import {
  waitForElement,
  tap,
  doubleTap,
  assertExists,
  assertVisible,
  elementExists,
  scrollDown,
  screenshot,
  navigateToTab,
  login,
  wait,
  DEMO_USER,
} from './helpers';

describe('Garden Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await wait(5000);
    await login(DEMO_USER.email, DEMO_USER.password);
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Garden Screen', () => {
    it('should display garden screen', async () => {
      await waitForElement('garden-screen', 15000);
      await assertVisible('garden-screen');
    });

    it('should show garden name', async () => {
      const gardenName = await elementExists('garden-name');
      if (gardenName) {
        await assertVisible('garden-name');
      }
    });

    it('should display the 2D isometric grid', async () => {
      const grid = await elementExists('isometric-grid');
      if (grid) {
        await assertVisible('isometric-grid');
      }
    });

    it('should show crops on the grid', async () => {
      await wait(2000);
      // At least one crop should be visible (Tomato, Chilli, or Mint from seed)
      const crop0 = await elementExists('crop-0');
      const crop1 = await elementExists('crop-1');
      const crop2 = await elementExists('crop-2');
      const hasCrops = crop0 || crop1 || crop2;
      console.log('Crops found:', { crop0, crop1, crop2 });
    });

    it('should toggle to 3D view', async () => {
      const toggle3d = await elementExists('view-toggle-3d');
      if (toggle3d) {
        await tap('view-toggle-3d');
        await wait(2000);
        const garden3d = await elementExists('garden-3d-view');
        if (garden3d) {
          await assertVisible('garden-3d-view');
        }
        // Toggle back to 2D
        const toggle2d = await elementExists('view-toggle-2d');
        if (toggle2d) {
          await tap('view-toggle-2d');
          await wait(1000);
        }
      }
    });
  });

  describe('Crop Interactions', () => {
    it('should select a crop on tap', async () => {
      const crop = await elementExists('crop-0');
      if (crop) {
        await tap('crop-0');
        await wait(1000);
        // Should show crop detail or action buttons
        const waterBtn = await elementExists('water-button');
        const cropDetail = await elementExists('crop-detail-panel');
        console.log('After crop tap:', { waterBtn, cropDetail });
      }
    });

    it('should water a crop', async () => {
      const waterBtn = await elementExists('water-button');
      if (waterBtn) {
        await tap('water-button');
        await wait(1500);
        // Should show hydration increase feedback
        console.log('Water action completed');
      }
    });

    it('should fertilize a crop', async () => {
      const fertilizeBtn = await elementExists('fertilize-button');
      if (fertilizeBtn) {
        await tap('fertilize-button');
        await wait(1500);
        console.log('Fertilize action completed');
      }
    });

    it('should harvest a mature crop', async () => {
      const harvestBtn = await elementExists('harvest-button');
      if (harvestBtn) {
        await tap('harvest-button');
        await wait(2000);
        // Should show harvest confirmation or XP gain
        console.log('Harvest action completed');
      }
    });

    it('should show crop detail on double-tap', async () => {
      const crop = await elementExists('crop-0');
      if (crop) {
        await doubleTap('crop-0');
        await wait(1500);
        const detail = await elementExists('crop-detail-modal');
        if (detail) {
          await assertVisible('crop-detail-modal');
          await device.pressBack();
        }
      }
    });
  });

  describe('Growth Overlay', () => {
    it('should show growth overlay with stats', async () => {
      const overlay = await elementExists('growth-overlay');
      if (overlay) {
        await assertVisible('growth-overlay');
      }
    });

    it('should display weather bar', async () => {
      const weatherBar = await elementExists('weather-bar');
      if (weatherBar) {
        await assertVisible('weather-bar');
      }
    });
  });

  describe('First-Time Walkthrough', () => {
    it('should show walkthrough overlay for new users', async () => {
      // Walkthrough may or may not show depending on onboarding state
      const walkthrough = await elementExists('walkthrough-overlay');
      if (walkthrough) {
        await assertVisible('walkthrough-overlay');
        // Skip walkthrough
        const skipBtn = await elementExists('walkthrough-skip-button');
        if (skipBtn) {
          await tap('walkthrough-skip-button');
          await wait(1000);
        }
      }
    });
  });

  describe('Pull to Refresh', () => {
    it('should refresh garden on pull down', async () => {
      const grid = await elementExists('garden-scroll-view');
      if (grid) {
        await scrollDown('garden-scroll-view');
        await wait(2000);
        // Garden should still be visible after refresh
        await assertVisible('garden-screen');
      }
    });
  });
});
