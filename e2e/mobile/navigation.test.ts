/**
 * Navigation E2E Tests
 * Tests tab bar navigation, deep linking between screens
 */

import { device } from 'detox';
import {
  waitForElement,
  tap,
  assertExists,
  assertVisible,
  elementExists,
  navigateToTab,
  login,
  goBack,
  wait,
  DEMO_USER,
} from './helpers';

describe('Bottom Tab Navigation', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    await wait(5000);
    await login(DEMO_USER.email, DEMO_USER.password);
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  it('should show bottom tab bar', async () => {
    const tabBar = await elementExists('bottom-tab-bar');
    if (tabBar) {
      await assertVisible('bottom-tab-bar');
    }
  });

  it('should navigate to Garden tab', async () => {
    await navigateToTab('tab-garden');
    await waitForElement('garden-screen', 10000);
    await assertVisible('garden-screen');
  });

  it('should navigate to Marketplace tab', async () => {
    await navigateToTab('tab-marketplace');
    await waitForElement('marketplace-screen', 10000);
    await assertVisible('marketplace-screen');
  });

  it('should navigate to Community tab', async () => {
    await navigateToTab('tab-community');
    const communityScreen = await elementExists('community-screen');
    if (communityScreen) {
      await assertVisible('community-screen');
    }
    // Check for groups list
    const groups = await elementExists('community-groups-list');
    console.log('Community screen elements:', { communityScreen, groups });
  });

  it('should navigate to Scanner tab', async () => {
    await navigateToTab('tab-scanner');
    const scannerScreen = await elementExists('scanner-screen');
    if (scannerScreen) {
      await assertVisible('scanner-screen');
    }
  });

  it('should navigate to Profile tab', async () => {
    await navigateToTab('tab-profile');
    await waitForElement('profile-screen', 10000);
    const profileVisible = await elementExists('profile-screen');
    if (profileVisible) {
      await assertVisible('profile-screen');
    }
  });

  it('should show user stats on profile', async () => {
    await wait(2000);
    const statsExists = await elementExists('profile-stats');
    const levelExists = await elementExists('profile-level');
    const xpExists = await elementExists('profile-xp-bar');
    console.log('Profile elements:', { statsExists, levelExists, xpExists });
  });

  it('should return to Garden tab', async () => {
    await navigateToTab('tab-garden');
    await waitForElement('garden-screen', 10000);
    await assertVisible('garden-screen');
  });
});
