# Skill: E2E Testing with Playwright

**Description**: Run end-to-end tests for GardenVerse using Playwright.
**Version**: 1.0.0
**Category**: Testing

## Trigger
After implementing a new feature or before release.

## Prerequisites
- Backend running on localhost:4000
- Admin dashboard running on localhost:3000
- Playwright installed (`npx playwright install`)

## Test Structure
Tests live in `test/e2e/` directory organized by domain:
```
test/e2e/
  auth.spec.ts        # Registration, login, logout, password reset
  garden.spec.ts      # Create garden, plant crops, water, harvest
  marketplace.spec.ts # Create listing, purchase, browse
  weather.spec.ts     # Weather data display, alerts
  iot.spec.ts         # Device registration, sensor data display
  admin.spec.ts       # Admin dashboard, user management, moderation
```

## Running Tests
```bash
# Install Playwright
npx playwright install

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test test/e2e/auth.spec.ts

# Run with UI mode
npx playwright test --ui

# Run with debug
npx playwright test --debug
```

## Writing Tests

### Page Object Pattern
```typescript
class LoginPage {
  constructor(private page: Page) {}
  
  async navigate() { await this.page.goto('/login'); }
  async login(email: string, password: string) { ... }
  async assertLoggedIn() { ... }
}
```

### Test Pattern
```typescript
test.describe('Authentication', () => {
  test('user can register and login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login('test@example.com', 'password123');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });
});
```

## CI Integration
E2E tests run in CI via `.github/workflows/e2e.yml`:
- Start backend, admin, and database services
- Run migrations
- Seed test data
- Execute Playwright tests
- Upload test artifacts on failure

## Validation
- [ ] All critical user journeys tested
- [ ] Tests run against real backend (not mocked)
- [ ] Test data cleaned up after run
- [ ] Tests are fast (< 30s per test file)
