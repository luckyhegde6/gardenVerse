import { by, device, element, expect } from 'detox';

const DEMO_EMAIL = 'demo@gardenverse.vercel.app';
const DEMO_PASSWORD = 'password123';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show login screen on launch', async () => {
    await expect(element(by.text('GardenVerse'))).toBeVisible();
    await expect(element(by.text('Cultivate. Connect. Thrive.'))).toBeVisible();
    await expect(element(by.id('login-email'))).toBeVisible();
    await expect(element(by.id('login-password'))).toBeVisible();
    await expect(element(by.id('login-button'))).toBeVisible();
  });

  it('should show validation errors for empty fields', async () => {
    await element(by.id('login-button')).tap();
    await expect(element(by.text('Email is required'))).toBeVisible();
    await expect(element(by.text('Password is required'))).toBeVisible();
  });

  it('should show validation error for invalid email', async () => {
    await element(by.id('login-email')).typeText('notanemail');
    await element(by.id('login-password')).typeText('password123');
    await element(by.id('login-button')).tap();
    await expect(element(by.text(/invalid email/i))).toBeVisible();
  });

  it('should show error for wrong credentials', async () => {
    await element(by.id('login-email')).clearText();
    await element(by.id('login-email')).typeText('wrong@example.com');
    await element(by.id('login-password')).clearText();
    await element(by.id('login-password')).typeText('wrongpassword');
    await element(by.id('login-button')).tap();
    await waitFor(element(by.text(/invalid|incorrect|failed/i)))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should login successfully with demo account', async () => {
    await element(by.id('login-email')).clearText();
    await element(by.id('login-email')).typeText(DEMO_EMAIL);
    await element(by.id('login-password')).clearText();
    await element(by.id('login-password')).typeText(DEMO_PASSWORD);
    await element(by.id('login-button')).tap();

    // Should navigate to garden tab
    await waitFor(element(by.id('tab-garden')))
      .toBeVisible()
      .withTimeout(15000);
    await expect(element(by.id('tab-garden'))).toBeVisible();
    await expect(element(by.id('tab-marketplace'))).toBeVisible();
    await expect(element(by.id('tab-scanner'))).toBeVisible();
    await expect(element(by.id('tab-community'))).toBeVisible();
    await expect(element(by.id('tab-profile'))).toBeVisible();
  });

  it('should persist auth across app restart', async () => {
    // Login first
    await element(by.id('login-email')).clearText();
    await element(by.id('login-email')).typeText(DEMO_EMAIL);
    await element(by.id('login-password')).clearText();
    await element(by.id('login-password')).typeText(DEMO_PASSWORD);
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('tab-garden'))).toBeVisible().withTimeout(15000);

    // Relaunch app
    await device.launchApp({ newInstance: false });

    // Should still be on garden tab (not redirected to login)
    await waitFor(element(by.id('tab-garden')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
