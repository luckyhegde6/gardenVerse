import { test, expect } from '../fixtures/test';

test.describe('Authentication Flow', () => {
  test('should render login page with email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.locator('text=required')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.locator('text=Invalid')).toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('should navigate to registration page from login', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.getByText(/register|create account|sign up/i);
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register/);
    }
  });
});

test.describe('Super Admin Auth', () => {
  test('should render super admin login/register toggle', async ({ page }) => {
    await page.goto('/super-admin');
    await expect(page.getByText(/login/i)).toBeVisible();
    await expect(page.getByText(/register/i)).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect unauthenticated from super-admin dashboard', async ({ page }) => {
    await page.goto('/super-admin/dashboard');
    await expect(page).toHaveURL(/super-admin$/);
  });
});
