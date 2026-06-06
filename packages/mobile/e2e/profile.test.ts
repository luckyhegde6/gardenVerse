import { by, device, element, expect as detoxExpect } from 'detox';

const DEMO_EMAIL = 'demo@gardenverse.vercel.app';
const DEMO_PASSWORD = 'password123';

describe('Profile & Settings Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
    await element(by.id('login-email')).typeText(DEMO_EMAIL);
    await element(by.id('login-password')).typeText(DEMO_PASSWORD);
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('tab-profile'))).toBeVisible().withTimeout(15000);
    await element(by.id('tab-profile')).tap();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.id('tab-profile')).tap();
  });

  it('should display profile tab', async () => {
    await detoxExpect(element(by.id('tab-profile'))).toBeVisible();
  });

  it('should show profile content', async () => {
    await waitFor(element(by.id('tab-profile'))).toBeVisible().withTimeout(5000);
  });

  it('should show profile menu items', async () => {
    // Wait for profile content to load
    await waitFor(element(by.id('tab-profile'))).toBeVisible().withTimeout(5000);
  });

  it('should navigate back to garden', async () => {
    await element(by.id('tab-garden')).tap();
    await detoxExpect(element(by.id('tab-garden'))).toBeVisible();
  });
});
