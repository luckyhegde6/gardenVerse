# E2E Testing Guidelines

## Test Stack
- **Framework**: Playwright (TypeScript)
- **Test Runner**: `@playwright/test`
- **Assertions**: Playwright built-in `expect`
- **Reporting**: HTML reporter + CI annotations

## Test Structure
```
test/e2e/
  auth.spec.ts          # Registration, login, logout, OTP
  garden.spec.ts        # Garden CRUD, crop planting, watering, harvesting
  marketplace.spec.ts   # Listings, purchase, disputes
  weather.spec.ts       # Weather display, forecasts, alerts
  iot.spec.ts           # Device registration, sensor data
  admin.spec.ts         # Admin dashboard, moderation
  fixtures/             # Test fixtures and factories
  helpers/              # Shared test utilities
  pages/                # Page Object Model classes
```

## Page Object Model
Every screen gets a Page Object class:
```typescript
// test/e2e/pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}
  
  async goto() { await this.page.goto('/login'); }
  async login(email: string, password: string) { ... }
  async assertLoginError(expected: string) { ... }
}
```

## Test Data Strategy
- Use API helpers to seed test data before E2E tests
- Clean up test data after test run (or use isolated test DB)
- Never depend on production data

## Critical User Journeys

### Auth Flow
```
1. Navigate to /register
2. Fill registration form (username, email, password, invite code)
3. Submit → redirect to OTP verification
4. Enter OTP → redirect to onboarding
5. Complete onboarding → dashboard visible
```

### Garden Flow
```
1. Create garden (name, type, description)
2. Plant crop (select seed, choose plot position)
3. Water crop → hydration increases
4. Wait for growth tick → growth stage advances
5. Harvest mature crop → inventory updated
```

### Marketplace Flow
```
1. Create marketplace listing
2. Browse listings (search, filter by category)
3. Purchase listing → credits deducted
4. View my transactions → purchase visible
```

## Performance Targets
- Each test: < 10 seconds
- Test file: < 60 seconds
- Full suite: < 10 minutes
- CI flake rate: < 1%

## Writing Good Tests

### DO
- Use descriptive test names: `user can plant a crop and see it in garden`
- Test one thing per test
- Use `test.beforeEach` for setup
- Add `@smoke` tag to critical path tests
- Use data-testid attributes on interactive elements

### DON'T
- Test implementation details (CSS classes, internal methods)
- Sleep/timers — use `waitForSelector` or network idle
- Share mutable state between tests
- Hardcode test data — use factories

## Debugging
```bash
# UI mode (watch tests run)
npx playwright test --ui

# Debug mode (step through)
npx playwright test --debug

# Last run replay
npx playwright show-report

# Trace viewer
npx playwright show-trace test-results/trace.zip
```
