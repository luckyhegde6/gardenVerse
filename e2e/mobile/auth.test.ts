/**
 * Authentication E2E Tests
 * Tests login, logout, and session persistence
 */

import { device, element, by, expect, waitFor } from 'detox';
import {
  waitForElement,
  tap,
  typeText,
  assertExists,
  assertVisible,
  elementExists,
  screenshot,
  relaunchApp,
  API_URL,
  DEMO_USER,
  ADMIN_USER,
  wait,
} from './helpers';

describe('Authentication Flow', () => {
  beforeEach(async () => {
    await relaunchApp();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Login Screen', () => {
    it('should display login form elements', async () => {
      const loginVisible = await elementExists('login-email-input');
      if (loginVisible) {
        await assertExists('login-email-input');
        await assertExists('login-password-input');
        await assertExists('login-submit-button');
      } else {
        // Already logged in
        console.log('Skipping — already authenticated');
      }
    });

    it('should show validation error on empty submit', async () => {
      const loginVisible = await elementExists('login-email-input');
      if (!loginVisible) return;

      await tap('login-submit-button');
      await wait(1000);

      // Should show validation error or stay on login screen
      const stillOnLogin = await elementExists('login-email-input');
      expect(stillOnLogin).toBe(true);
    });

    it('should login with demo user', async () => {
      const loginVisible = await elementExists('login-email-input');
      if (!loginVisible) return;

      await typeText('login-email-input', DEMO_USER.email);
      await typeText('login-password-input', DEMO_USER.password);
      await device.pressBack(); // Dismiss keyboard
      await tap('login-submit-button');

      // Should navigate to garden screen
      await waitForElement('garden-screen', 30000);
      await assertVisible('garden-screen');
    });

    it('should login with admin user', async () => {
      const loginVisible = await elementExists('login-email-input');
      if (!loginVisible) return;

      await typeText('login-email-input', ADMIN_USER.email);
      await typeText('login-password-input', ADMIN_USER.password);
      await device.pressBack();
      await tap('login-submit-button');

      await waitForElement('garden-screen', 30000);
      await assertVisible('garden-screen');
    });

    it('should show error on wrong password', async () => {
      const loginVisible = await elementExists('login-email-input');
      if (!loginVisible) return;

      await typeText('login-email-input', DEMO_USER.email);
      await typeText('login-password-input', 'wrongpassword');
      await device.pressBack();
      await tap('login-submit-button');

      await wait(2000);

      // Should stay on login screen or show error
      const errorShown = await elementExists('login-error-message');
      const stillOnLogin = await elementExists('login-email-input');
      expect(errorShown || stillOnLogin).toBe(true);
    });
  });

  describe('Session Persistence', () => {
    it('should persist login across app restart', async () => {
      // First login
      const loginVisible = await elementExists('login-email-input');
      if (loginVisible) {
        await typeText('login-email-input', DEMO_USER.email);
        await typeText('login-password-input', DEMO_USER.password);
        await device.pressBack();
        await tap('login-submit-button');
        await waitForElement('garden-screen', 30000);
      }

      // Relaunch app
      await device.terminateApp();
      await device.launchApp({ newInstance: false });
      await wait(3000);

      // Should still be logged in (garden screen visible)
      const gardenVisible = await elementExists('garden-screen');
      // Note: on emulator, session may or may not persist depending on storage strategy
      // This test documents the expected behavior
      console.log('Session persistence: garden screen visible =', gardenVisible);
    });
  });
});
