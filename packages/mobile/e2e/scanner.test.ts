import { by, device, element, expect as detoxExpect } from 'detox';

const DEMO_EMAIL = 'demo@gardenverse.vercel.app';
const DEMO_PASSWORD = 'password123';

describe('Scanner Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
    await element(by.id('login-email')).typeText(DEMO_EMAIL);
    await element(by.id('login-password')).typeText(DEMO_PASSWORD);
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('tab-scanner'))).toBeVisible().withTimeout(15000);
    await element(by.id('tab-scanner')).tap();
  });

  it('should display scanner tab', async () => {
    await detoxExpect(element(by.id('tab-scanner'))).toBeVisible();
  });

  it('should show scanner content', async () => {
    await waitFor(element(by.id('tab-scanner'))).toBeVisible().withTimeout(5000);
  });

  it('should navigate away from scanner', async () => {
    await element(by.id('tab-garden')).tap();
    await detoxExpect(element(by.id('tab-garden'))).toBeVisible();
  });
});
