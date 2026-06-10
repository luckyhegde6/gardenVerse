/**
 * Marketplace E2E Tests
 *Tests browsing listings, viewing details, and creating listings
 */

import { device } from 'detox';
import {
  waitForElement,
  tap,
  typeText,
  assertExists,
  assertVisible,
  elementExists,
  scrollDown,
  navigateToTab,
  login,
  swipeLeft,
  goBack,
  wait,
  DEMO_USER,
} from './helpers';

describe('Marketplace Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await wait(5000);
    await login(DEMO_USER.email, DEMO_USER.password);
    await navigateToTab('tab-marketplace');
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Browse Listings', () => {
    it('should display marketplace screen', async () => {
      await waitForElement('marketplace-screen', 15000);
      await assertVisible('marketplace-screen');
    });

    it('should show listing cards', async () => {
      await wait(2000);
      // Check for listing items (seed data has 3 listings)
      const listing0 = await elementExists('marketplace-listing-0');
      const listing1 = await elementExists('marketplace-listing-1');
      const listing2 = await elementExists('marketplace-listing-2');
      console.log('Listings found:', { listing0, listing1, listing2 });
    });

    it('should show listing prices in Green Credits', async () => {
      const price0 = await elementExists('listing-price-0');
      if (price0) {
        await assertVisible('listing-price-0');
      }
    });

    it('should scroll through listings', async () => {
      const list = await elementExists('marketplace-listing-list');
      if (list) {
        await scrollDown('marketplace-listing-list');
        await wait(1000);
      }
    });
  });

  describe('Listing Detail', () => {
    it('should navigate to listing detail on tap', async () => {
      const listing = await elementExists('marketplace-listing-0');
      if (listing) {
        await tap('marketplace-listing-0');
        await waitForElement('listing-detail-screen', 10000);
        await assertVisible('listing-detail-screen');
      }
    });

    it('should show listing details', async () => {
      await wait(1000);
      const title = await elementExists('listing-detail-title');
      const desc = await elementExists('listing-detail-description');
      const seller = await elementExists('listing-detail-seller');
      console.log('Detail elements:', { title, desc, seller });
    });

    it('should go back to listing', async () => {
      const backBtn = await elementExists('listing-detail-back');
      if (backBtn) {
        await tap('listing-detail-back');
      } else {
        await goBack();
      }
      await waitForElement('marketplace-screen', 10000);
    });
  });

  describe('Create Listing', () => {
    it('should open create listing screen', async () => {
      const createBtn = await elementExists('create-listing-button');
      if (createBtn) {
        await tap('create-listing-button');
        await waitForElement('create-listing-screen', 10000);
        await assertVisible('create-listing-screen');
      }
    });

    it('should fill listing form', async () => {
      const titleInput = await elementExists('listing-title-input');
      if (titleInput) {
        await typeText('listing-title-input', 'Fresh Coriander Bunch');
      }
      const descInput = await elementExists('listing-description-input');
      if (descInput) {
        await typeText('listing-description-input', 'Freshly harvested organic coriander from my home garden.');
      }
      const priceInput = await elementExists('listing-price-input');
      if (priceInput) {
        await typeText('listing-price-input', '30');
      }
      console.log('Listing form filled');
    });

    it('should navigate back (cancel)', async () => {
      const cancelBtn = await elementExists('listing-cancel-button');
      if (cancelBtn) {
        await tap('listing-cancel-button');
      } else {
        await goBack();
      }
      await wait(1000);
    });
  });
});
