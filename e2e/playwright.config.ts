import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const OUTPUT_DIR = path.resolve(__dirname, '..', 'playwright-report');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1,
  reporter: [
    ['html', { outputFolder: path.join(OUTPUT_DIR, 'html'), open: 'never' }],
    ['json', { outputFile: path.join(OUTPUT_DIR, 'results.json') }],
    ['junit', { outputFile: path.join(OUTPUT_DIR, 'junit.xml') }],
    ['list'],
  ],
  timeout: 60000,
  expect: { timeout: 10000 },

  outputDir: path.join(OUTPUT_DIR, 'artifacts'),

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
