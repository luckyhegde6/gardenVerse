import { chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const RECORDING_DIR = path.resolve(__dirname, '..', '..', 'playwright-report', 'recordings');

interface RecordingStep {
  name: string;
  action: (page: any) => Promise<void>;
  delay?: number;
}

interface RecordingConfig {
  name: string;
  filename: string;
  steps: RecordingStep[];
}

const RECORDINGS: RecordingConfig[] = [
  {
    name: 'Authentication & Super Admin',
    filename: '01-auth-super-admin',
    steps: [
      { name: 'Navigate to login page', action: async (page) => { await page.goto(`${BASE_URL}/login`); await page.waitForLoadState('networkidle'); }, delay: 2000 },
      { name: 'Fill login credentials', action: async (page) => { await page.fill('input[type="email"]', 'admin@gardenverse.test'); await page.fill('input[type="password"]', 'Test@12345678'); }, delay: 2000 },
      { name: 'Visit Super Admin portal', action: async (page) => { await page.goto(`${BASE_URL}/super-admin`); }, delay: 2000 },
      { name: 'Toggle to registration form', action: async (page) => { const btn = page.locator('button:has-text("Register")'); if (await btn.isVisible()) await btn.click(); }, delay: 2000 },
    ],
  },
  {
    name: 'Garden Management',
    filename: '02-garden-management',
    steps: [
      { name: 'View garden overview', action: async (page) => { await page.goto(`${BASE_URL}/garden`); await page.waitForLoadState('networkidle'); }, delay: 2000 },
      { name: 'Browse plant selection', action: async (page) => { await page.goto(`${BASE_URL}/garden/plant`); }, delay: 2000 },
      { name: 'Search plants in database', action: async (page) => { await page.goto(`${BASE_URL}/plants`); }, delay: 3000 },
      { name: 'View crop details', action: async (page) => { await page.goto(`${BASE_URL}/garden/crop/demo`); }, delay: 2000 },
    ],
  },
  {
    name: 'Admin Dashboard & Management',
    filename: '03-admin-management',
    steps: [
      { name: 'Admin dashboard overview', action: async (page) => { await page.goto(`${BASE_URL}/dashboard`); await page.waitForLoadState('networkidle'); }, delay: 2000 },
      { name: 'User management', action: async (page) => { await page.goto(`${BASE_URL}/users`); }, delay: 2000 },
      { name: 'Invite management', action: async (page) => { await page.goto(`${BASE_URL}/invites`); }, delay: 2000 },
      { name: 'Super Admin dashboard', action: async (page) => { await page.goto(`${BASE_URL}/super-admin/dashboard`); }, delay: 3000 },
    ],
  },
  {
    name: 'Weather & Environmental Data',
    filename: '04-weather',
    steps: [
      { name: 'Weather dashboard with OpenWeatherMap', action: async (page) => { await page.goto(`${BASE_URL}/weather`); await page.waitForLoadState('networkidle'); }, delay: 3000 },
    ],
  },
  {
    name: 'Marketplace & Trading',
    filename: '05-marketplace',
    steps: [
      { name: 'Browse marketplace listings', action: async (page) => { await page.goto(`${BASE_URL}/marketplace`); await page.waitForLoadState('networkidle'); }, delay: 2000 },
      { name: 'Create new listing', action: async (page) => { await page.goto(`${BASE_URL}/marketplace/create`); }, delay: 2000 },
    ],
  },
  {
    name: 'AI Scanner & Plant Identification',
    filename: '06-ai-scanner',
    steps: [
      { name: 'AI Scanner interface', action: async (page) => { await page.goto(`${BASE_URL}/ai-scanner`); await page.waitForLoadState('networkidle'); }, delay: 2000 },
      { name: 'Scan history', action: async (page) => { await page.goto(`${BASE_URL}/ai-scanner/history`); }, delay: 2000 },
    ],
  },
  {
    name: 'Community & Groups',
    filename: '07-community',
    steps: [
      { name: 'Community hub', action: async (page) => { await page.goto(`${BASE_URL}/community`); await page.waitForLoadState('networkidle'); }, delay: 2000 },
      { name: 'Community groups', action: async (page) => { await page.goto(`${BASE_URL}/community/groups`); }, delay: 2000 },
    ],
  },
];

async function main() {
  console.log('\n=== 🎥 GardenVerse Demo Recording ===\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  fs.mkdirSync(RECORDING_DIR, { recursive: true });

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  for (const recording of RECORDINGS) {
    console.log(`  🎬 Recording: ${recording.name}...`);

    const context = await browser.newContext({
      recordVideo: {
        dir: RECORDING_DIR,
        size: { width: 1440, height: 900 },
      },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);

    try {
      for (let i = 0; i < recording.steps.length; i++) {
        const step = recording.steps[i];
        console.log(`    Step ${i + 1}/${recording.steps.length}: ${step.name}`);
        await step.action(page);
        if (step.delay) await page.waitForTimeout(step.delay);
      }

      // Extra time for the last frame
      await page.waitForTimeout(2000);
      await context.close();
      console.log(`    ✅ Saved to: ${recording.filename}.webm\n`);
    } catch (err) {
      console.error(`    ❌ Recording failed: ${err}\n`);
      await context.close();
    }
  }

  await browser.close();

  console.log('  📝 Generating recording manifest...');
  const manifest = RECORDINGS.map(r => ({
    name: r.name,
    filename: r.filename,
    steps: r.steps.map(s => s.name),
  }));
  fs.writeFileSync(
    path.join(RECORDING_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );

  console.log(`\n  ✅ All recordings saved to: ${RECORDING_DIR}\n`);
}

main().catch(console.error);
