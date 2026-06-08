/**
 * GardenVerse Mobile E2E Test Helpers
 *
 * Shared utilities for Detox tests on Android emulator.
 */

import { device, element, by, expect, waitFor } from 'detox';

/** Android emulator maps 10.0.2.2 to host localhost */
export const API_URL = 'http://10.0.2.2:3000';

/** Demo account credentials — password from ADMIN_DEFAULT_PASSWORD env var */
const DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'password123'

export const DEMO_USER = {
  email: 'demo@gardenverse.vercel.app',
  password: DEFAULT_PASSWORD,
};

export const ADMIN_USER = {
  email: 'admin@gardenverse.vercel.app',
  password: DEFAULT_PASSWORD,
};

export const SUPERADMIN_USER = {
  email: 'superadmin@gardenverse.vercel.app',
  password: DEFAULT_PASSWORD,
};

/**
 * Wait for an element to be visible with a timeout.
 */
export async function waitForElement(
  testID: string,
  timeout = 30000
): Promise<void> {
  await waitFor(element(by.id(testID))).toBeVisible().withTimeout(timeout);
}

/**
 * Tap an element by testID.
 */
export async function tap(testID: string): Promise<void> {
  await element(by.id(testID)).tap();
}

/**
 * Double-tap an element by testID.
 */
export async function doubleTap(testID: string): Promise<void> {
  await element(by.id(testID)).multiTap(2);
}

/**
 * Type text into an input identified by testID.
 */
export async function typeText(testID: string, text: string): Promise<void> {
  await element(by.id(testID)).typeText(text);
}

/**
 * Clear and type text into an input.
 */
export async function clearAndType(testID: string, text: string): Promise<void> {
  await element(by.id(testID).withAncestor(by.id(testID))).clearText();
  await element(by.id(testID)).typeText(text);
}

/**
 * Assert that an element exists in the view hierarchy.
 */
export async function assertExists(testID: string): Promise<void> {
  await expect(element(by.id(testID))).toExist();
}

/**
 * Assert that an element is visible on screen.
 */
export async function assertVisible(testID: string): Promise<void> {
  await expect(element(by.id(testID))).toBeVisible();
}

/**
 * Assert that an element does NOT exist.
 */
export async function assertNotExists(testID: string): Promise<void> {
  await expect(element(by.id(testID))).not.toExist();
}

/**
 * Check if an element exists (returns boolean, no throw).
 */
export async function elementExists(testID: string): Promise<boolean> {
  try {
    await expect(element(by.id(testID))).toExist();
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for an element to not exist (e.g., loading spinner disappears).
 */
export async function waitForElementToGone(
  testID: string,
  timeout = 30000
): Promise<void> {
  await waitFor(element(by.id(testID)))
    .not.toExist()
    .withTimeout(timeout);
}

/**
 * Scroll down on a scrollable view.
 */
export async function scrollDown(testID?: string): Promise<void> {
  if (testID) {
    await element(by.id(testID)).scroll(500, 'down');
  } else {
    await element(by.type('android.widget.ScrollView')).scroll(500, 'down');
  }
}

/**
 * Scroll up on a scrollable view.
 */
export async function scrollUp(testID?: string): Promise<void> {
  if (testID) {
    await element(by.id(testID)).scroll(500, 'up');
  } else {
    await element(by.type('android.widget.ScrollView')).scroll(500, 'up');
  }
}

/**
 * Navigate to a tab by its testID.
 */
export async function navigateToTab(tabTestID: string): Promise<void> {
  await tap(tabTestID);
  await new Promise((r) => setTimeout(r, 1500));
}

/**
 * Login with given credentials.
 */
export async function login(email: string, password: string): Promise<void> {
  const isLoggedIn = await elementExists('garden-screen');
  if (isLoggedIn) return;

  const loginVisible = await elementExists('login-email-input');
  if (!loginVisible) {
    // May need to logout first
    return;
  }

  await typeText('login-email-input', email);
  await typeText('login-password-input', password);
  await device.pressBack(); // Hide keyboard
  await tap('login-submit-button');
  await waitForElement('garden-screen', 30000);
}

/**
 * Logout from the app.
 */
export async function logout(): Promise<void> {
  const profileTab = await elementExists('tab-profile');
  if (profileTab) {
    await tap('tab-profile');
    await new Promise((r) => setTimeout(r, 1000));
    const settingsBtn = await elementExists('profile-settings-button');
    if (settingsBtn) {
      await tap('profile-settings-button');
      await new Promise((r) => setTimeout(r, 1000));
      const logoutBtn = await elementExists('settings-logout-button');
      if (logoutBtn) {
        await tap('settings-logout-button');
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
}

/**
 * Take a screenshot for debugging.
 */
export async function screenshot(name: string): Promise<void> {
  await device.takeScreenshot(name);
}

/**
 * Relaunch the app (clean state).
 */
export async function relaunchApp(): Promise<void> {
  await device.terminateApp();
  await device.launchApp({ newInstance: true });
  await new Promise((r) => setTimeout(r, 5000));
}

/**
 * Wait for network request to complete (checks for loading indicator to disappear).
 */
export async function waitForLoadingDone(
  loadingTestID = 'loading-spinner',
  timeout = 30000
): Promise<void> {
  const isLoading = await elementExists(loadingTestID);
  if (isLoading) {
    await waitForElementToGone(loadingTestID, timeout);
  }
}

/**
 * Get text content from an element.
 */
export async function getText(testID: string): Promise<string> {
  const attributes = await element(by.id(testID)).getAttributes();
  return (attributes as any).text || '';
}

/**
 * Assert element contains specific text.
 */
export async function assertTextContains(
  testID: string,
  expectedText: string
): Promise<void> {
  const text = await getText(testID);
  expect(text.toLowerCase()).toContain(expectedText.toLowerCase());
}

/**
 * Swipe left on an element (e.g., for carousel/pager).
 */
export async function swipeLeft(testID: string): Promise<void> {
  await element(by.id(testID)).swipe('left', 'fast', 0.75);
}

/**
 * Swipe right on an element.
 */
export async function swipeRight(testID: string): Promise<void> {
  await element(by.id(testID)).swipe('right', 'fast', 0.75);
}

/**
 * Press the Android back button.
 */
export async function goBack(): Promise<void> {
  await device.pressBack();
}

/**
 * Wait for a specified duration.
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
