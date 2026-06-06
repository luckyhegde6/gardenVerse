import { by, device, element, expect as detoxExpect } from 'detox';

const DEMO_EMAIL = 'demo@gardenverse.vercel.app';
const DEMO_PASSWORD = 'password123';

describe('Community Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
    await element(by.id('login-email')).typeText(DEMO_EMAIL);
    await element(by.id('login-password')).typeText(DEMO_PASSWORD);
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('tab-community'))).toBeVisible().withTimeout(15000);
    await element(by.id('tab-community')).tap();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.id('tab-community')).tap();
  });

  it('should display community tab', async () => {
    await detoxExpect(element(by.id('tab-community'))).toBeVisible();
  });

  it('should show community content', async () => {
    await waitFor(element(by.id('tab-community'))).toBeVisible().withTimeout(5000);
  });

  it('should navigate to profile and back', async () => {
    await element(by.id('tab-profile')).tap();
    await detoxExpect(element(by.id('tab-profile'))).toBeVisible();
    await element(by.id('tab-community')).tap();
    await detoxExpect(element(by.id('tab-community'))).toBeVisible();
  });
});
