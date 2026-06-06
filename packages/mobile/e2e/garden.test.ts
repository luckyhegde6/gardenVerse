import { by, device, element, expect } from 'detox';

const DEMO_EMAIL = 'demo@gardenverse.vercel.app';
const DEMO_PASSWORD = 'password123';

async function login() {
  await device.launchApp({ newInstance: true, delete: true });
  await element(by.id('login-email')).typeText(DEMO_EMAIL);
  await element(by.id('login-password')).typeText(DEMO_PASSWORD);
  await element(by.id('login-button')).tap();
  await waitFor(element(by.id('tab-garden'))).toBeVisible().withTimeout(15000);
}

describe('Garden Flow', () => {
  beforeAll(async () => {
    await login();
  });

  it('should display garden tab as active on launch', async () => {
    await expect(element(by.id('tab-garden'))).toBeVisible();
  });

  it('should show garden content', async () => {
    // Garden screen should show some content (garden name, grid, or empty state)
    await waitFor(element(by.text(/garden|Demo Garden|No Gardens|plant/i)))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should navigate to marketplace tab', async () => {
    await element(by.id('tab-marketplace')).tap();
    await waitFor(element(by.text(/market|marketplace|listing/i)))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should navigate back to garden tab', async () => {
    await element(by.id('tab-garden')).tap();
    await waitFor(element(by.text(/garden|Demo Garden|plant/i)))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should navigate to scanner tab', async () => {
    await element(by.id('tab-scanner')).tap();
    await waitFor(element(by.text(/scan|camera|scanner|plant doctor/i)))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should navigate to community tab', async () => {
    await element(by.id('tab-community')).tap();
    await waitFor(element(by.text(/community|group|leaderboard/i)))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should navigate to profile tab', async () => {
    await element(by.id('tab-profile')).tap();
    await waitFor(element(by.text(/profile|settings|inventory|achievements/i)))
      .toBeVisible()
      .withTimeout(10000);
  });
});
