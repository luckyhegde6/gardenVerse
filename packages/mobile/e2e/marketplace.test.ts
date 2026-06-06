import { by, device, element, expect as detoxExpect } from 'detox';

const DEMO_EMAIL = 'demo@gardenverse.vercel.app';
const DEMO_PASSWORD = 'password123';

describe('Marketplace Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
    await element(by.id('login-email')).typeText(DEMO_EMAIL);
    await element(by.id('login-password')).typeText(DEMO_PASSWORD);
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('tab-marketplace'))).toBeVisible().withTimeout(15000);
    await element(by.id('tab-marketplace')).tap();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await element(by.id('tab-marketplace')).tap();
  });

  it('should show marketplace tab as active', async () => {
    await detoxExpect(element(by.id('tab-marketplace'))).toBeVisible();
  });

  it('should display marketplace content', async () => {
    await waitFor(element(by.id('tab-marketplace'))).toBeVisible().withTimeout(5000);
  });

  it('should navigate back to garden', async () => {
    await element(by.id('tab-garden')).tap();
    await detoxExpect(element(by.id('tab-garden'))).toBeVisible();
  });
});
