import { chromium, Browser, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'screenshots');
const WORKFLOW_DATA_DIR = path.resolve(__dirname, '..', 'workflows-data');
const VIDEO_DIR = path.resolve(__dirname, '..', '..', 'playwright-report', 'videos');

interface Step {
  name: string;
  action: () => Promise<void>;
  screenshot: string;
}

interface WorkflowResult {
  name: string;
  steps: { name: string; screenshotPath: string }[];
  videoPath?: string;
  duration: number;
}

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(WORKFLOW_DATA_DIR, { recursive: true });
fs.mkdirSync(VIDEO_DIR, { recursive: true });

async function takeScreenshot(page: Page, workflow: string, step: string): Promise<string> {
  const dir = path.join(SCREENSHOT_DIR, workflow);
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${step.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
  const filepath = path.join(dir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

async function runAuthWorkflow(browser: Browser): Promise<WorkflowResult> {
  const context = await browser.newContext({ recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  const steps: { name: string; screenshotPath: string }[] = [];
  const start = Date.now();

  try {
    // Step 1: Login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Login Page', screenshotPath: await takeScreenshot(page, 'auth', '01-login-page') });

    // Step 2: Fill login form
    await page.fill('input[type="email"]', 'admin@gardenverse.test');
    await page.fill('input[type="password"]', 'Test@12345678');
    steps.push({ name: 'Login Form Filled', screenshotPath: await takeScreenshot(page, 'auth', '02-login-filled') });

    // Step 3: Super Admin toggle
    await page.goto(`${BASE_URL}/super-admin`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Super Admin Login', screenshotPath: await takeScreenshot(page, 'auth', '03-super-admin-login') });

    // Step 4: Register toggle
    await page.click('button:has-text("Register")');
    await page.waitForTimeout(500);
    steps.push({ name: 'Super Admin Register', screenshotPath: await takeScreenshot(page, 'auth', '04-super-admin-register') });

    // Step 5: Protected route redirect
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Protected Route Redirect', screenshotPath: await takeScreenshot(page, 'auth', '05-protected-redirect') });
  } finally {
    await context.close();
  }

  return { name: 'Authentication Flow', steps, duration: Date.now() - start };
}

async function runGardenWorkflow(browser: Browser): Promise<WorkflowResult> {
  const context = await browser.newContext({ recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  const steps: { name: string; screenshotPath: string }[] = [];
  const start = Date.now();

  try {
    // Garden Home
    await page.goto(`${BASE_URL}/garden`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Garden Overview', screenshotPath: await takeScreenshot(page, 'garden', '01-garden-overview') });

    // Plant Crop screen
    await page.goto(`${BASE_URL}/garden/plant`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Plant Selection', screenshotPath: await takeScreenshot(page, 'garden', '02-plant-selection') });

    // Plant browser
    await page.goto(`${BASE_URL}/plants`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Plant Browser', screenshotPath: await takeScreenshot(page, 'garden', '03-plant-browser') });

    // Crop Detail
    await page.goto(`${BASE_URL}/garden/crop/demo`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Crop Detail', screenshotPath: await takeScreenshot(page, 'garden', '04-crop-detail') });
  } finally {
    await context.close();
  }

  return { name: 'Garden Management', steps, duration: Date.now() - start };
}

async function runAdminWorkflow(browser: Browser): Promise<WorkflowResult> {
  const context = await browser.newContext({ recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  const steps: { name: string; screenshotPath: string }[] = [];
  const start = Date.now();

  try {
    // Dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Admin Dashboard', screenshotPath: await takeScreenshot(page, 'admin', '01-dashboard') });

    // Users page
    await page.goto(`${BASE_URL}/users`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Users Management', screenshotPath: await takeScreenshot(page, 'admin', '02-users') });

    // Marketplace
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Marketplace', screenshotPath: await takeScreenshot(page, 'admin', '03-marketplace') });

    // Invites
    await page.goto(`${BASE_URL}/invites`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Invite Management', screenshotPath: await takeScreenshot(page, 'admin', '04-invites') });

    // Super Admin Dashboard
    await page.goto(`${BASE_URL}/super-admin/dashboard`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Super Admin Dashboard', screenshotPath: await takeScreenshot(page, 'admin', '05-super-admin') });
  } finally {
    await context.close();
  }

  return { name: 'Admin Portal', steps, duration: Date.now() - start };
}

async function runWeatherWorkflow(browser: Browser): Promise<WorkflowResult> {
  const context = await browser.newContext({ recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  const steps: { name: string; screenshotPath: string }[] = [];
  const start = Date.now();

  try {
    await page.goto(`${BASE_URL}/weather`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Weather Dashboard', screenshotPath: await takeScreenshot(page, 'weather', '01-weather-dashboard') });
  } finally {
    await context.close();
  }

  return { name: 'Weather', steps, duration: Date.now() - start };
}

async function runMarketplaceWorkflow(browser: Browser): Promise<WorkflowResult> {
  const context = await browser.newContext({ recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  const steps: { name: string; screenshotPath: string }[] = [];
  const start = Date.now();

  try {
    await page.goto(`${BASE_URL}/marketplace`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Marketplace Overview', screenshotPath: await takeScreenshot(page, 'marketplace', '01-marketplace') });

    await page.goto(`${BASE_URL}/marketplace/create`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Create Listing', screenshotPath: await takeScreenshot(page, 'marketplace', '02-create-listing') });
  } finally {
    await context.close();
  }

  return { name: 'Marketplace', steps, duration: Date.now() - start };
}

async function runCommunityWorkflow(browser: Browser): Promise<WorkflowResult> {
  const context = await browser.newContext({ recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  const steps: { name: string; screenshotPath: string }[] = [];
  const start = Date.now();

  try {
    await page.goto(`${BASE_URL}/community`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Community Hub', screenshotPath: await takeScreenshot(page, 'community', '01-community-hub') });

    await page.goto(`${BASE_URL}/community/groups`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Groups', screenshotPath: await takeScreenshot(page, 'community', '02-groups') });
  } finally {
    await context.close();
  }

  return { name: 'Community', steps, duration: Date.now() - start };
}

async function runAiScannerWorkflow(browser: Browser): Promise<WorkflowResult> {
  const context = await browser.newContext({ recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  const steps: { name: string; screenshotPath: string }[] = [];
  const start = Date.now();

  try {
    await page.goto(`${BASE_URL}/ai-scanner`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'AI Scanner', screenshotPath: await takeScreenshot(page, 'ai-scanner', '01-ai-scanner') });

    await page.goto(`${BASE_URL}/ai-scanner/history`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Scan History', screenshotPath: await takeScreenshot(page, 'ai-scanner', '02-scan-history') });
  } finally {
    await context.close();
  }

  return { name: 'AI Scanner', steps, duration: Date.now() - start };
}

async function runGamificationWorkflow(browser: Browser): Promise<WorkflowResult> {
  const context = await browser.newContext({ recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  const steps: { name: string; screenshotPath: string }[] = [];
  const start = Date.now();

  try {
    await page.goto(`${BASE_URL}/gamification`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Gamification Dash', screenshotPath: await takeScreenshot(page, 'gamification', '01-gamification') });
  } finally {
    await context.close();
  }

  return { name: 'Gamification', steps, duration: Date.now() - start };
}

async function runInvitesWorkflow(browser: Browser): Promise<WorkflowResult> {
  const context = await browser.newContext({ recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } } });
  const page = await context.newPage();
  const steps: { name: string; screenshotPath: string }[] = [];
  const start = Date.now();

  try {
    await page.goto(`${BASE_URL}/invites`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Invite System', screenshotPath: await takeScreenshot(page, 'invites', '01-invites') });

    await page.goto(`${BASE_URL}/invites/create`);
    await page.waitForLoadState('networkidle');
    steps.push({ name: 'Create Invite', screenshotPath: await takeScreenshot(page, 'invites', '02-create-invite') });
  } finally {
    await context.close();
  }

  return { name: 'Invites', steps, duration: Date.now() - start };
}

async function generateHtml(results: WorkflowResult[]): Promise<void> {
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GardenVerse — Workflow Screenshots</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; }
    .header { background: linear-gradient(135deg, #166534, #15803d); color: white; padding: 48px 24px; text-align: center; }
    .header h1 { font-size: 2.5rem; margin-bottom: 8px; }
    .header p { font-size: 1.1rem; opacity: 0.9; }
    .container { max-width: 1200px; margin: 0 auto; padding: 32px 16px; }
    .workflow-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; margin-bottom: 48px; }
    .workflow-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s; }
    .workflow-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .workflow-card-header { padding: 20px; border-bottom: 1px solid #f1f5f9; }
    .workflow-card-header h2 { font-size: 1.25rem; font-weight: 600; margin-bottom: 4px; }
    .workflow-card-header .meta { font-size: 0.875rem; color: #64748b; }
    .workflow-card-body { padding: 16px 20px; }
    .step-list { list-style: none; }
    .step-list li { padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; }
    .step-list li:last-child { border-bottom: none; }
    .step-number { display: inline-flex; width: 24px; height: 24px; background: #166534; color: white; border-radius: 50%; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; flex-shrink: 0; }
    .workflow-detail { display: none; background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 32px; overflow: hidden; }
    .workflow-detail.active { display: block; }
    .view-btn { display: inline-block; padding: 8px 16px; background: #166534; color: white; border-radius: 8px; text-decoration: none; font-size: 0.875rem; font-weight: 500; margin-top: 12px; }
    .screenshot-viewer { position: relative; width: 100%; }
    .screenshot-viewer img { width: 100%; display: none; border-radius: 8px; }
    .screenshot-viewer img.active { display: block; }
    .screenshot-nav { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; }
    .screenshot-nav button { background: #166534; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.875rem; }
    .screenshot-nav button:disabled { opacity: 0.5; cursor: not-allowed; }
    .screenshot-nav .step-indicator { font-size: 0.875rem; color: #64748b; }
    .video-section { margin-top: 16px; padding: 16px; background: #f8fafc; border-radius: 8px; }
    .video-section video { width: 100%; border-radius: 8px; }
    .duration { font-size: 0.8rem; color: #94a3b8; }
    @media (max-width: 768px) { .workflow-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌱 GardenVerse</h1>
    <p>Workflow Screenshots & Demo Recordings</p>
  </div>
  <div class="container">
    <div class="workflow-grid">
      ${results.map((r, i) => `
      <div class="workflow-card">
        <div class="workflow-card-header">
          <h2>${escapeHtml(r.name)}</h2>
          <div class="meta">${r.steps.length} steps · ${(r.duration / 1000).toFixed(1)}s</div>
        </div>
        <div class="workflow-card-body">
          <ul class="step-list">
            ${r.steps.map((s, j) => `<li><span class="step-number">${j + 1}</span> ${escapeHtml(s.name)}</li>`).join('')}
          </ul>
          <a class="view-btn" href="workflow-${i}.html">View Details →</a>
        </div>
      </div>`).join('')}
    </div>

    <h2 style="font-size:1.5rem; margin-bottom: 16px;">📊 Summary</h2>
    <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <p style="margin-bottom:8px;">Total Workflows: <strong>${results.length}</strong></p>
      <p style="margin-bottom:8px;">Total Screenshots: <strong>${results.reduce((a, r) => a + r.steps.length, 0)}</strong></p>
      <p>Total Duration: <strong>${(results.reduce((a, r) => a + r.duration, 0) / 1000).toFixed(1)}s</strong></p>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(WORKFLOW_DATA_DIR, 'index.html'), indexHtml);

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const workflowHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(r.name)} — GardenVerse</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; }
    .header { background: linear-gradient(135deg, #166534, #15803d); color: white; padding: 24px; }
    .header h1 { font-size: 1.5rem; }
    .header a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.9rem; }
    .container { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
    .viewer-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .screenshot-container { padding: 16px; }
    .screenshot-container img { width: 100%; border-radius: 8px; border: 1px solid #e2e8f0; display: none; }
    .screenshot-container img.active { display: block; }
    .controls { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px; border-top: 1px solid #f1f5f9; flex-wrap: wrap; }
    .controls button { background: #166534; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 500; }
    .controls button:hover { background: #15803d; }
    .controls button:disabled { opacity: 0.4; cursor: not-allowed; }
    .controls .info { font-size: 0.9rem; color: #64748b; }
    .step-list { padding: 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .step-list h3 { font-size: 0.9rem; color: #64748b; margin-bottom: 8px; }
    .step-list ul { list-style: none; display: flex; gap: 8px; flex-wrap: wrap; }
    .step-list li { padding: 6px 12px; background: white; border-radius: 20px; font-size: 0.8rem; border: 1px solid #e2e8f0; cursor: pointer; }
    .step-list li.active { background: #166534; color: white; border-color: #166534; }
    .auto-play { display: flex; align-items: center; gap: 8px; padding: 8px 16px; cursor: pointer; }
    .progress-bar { height: 4px; background: #e2e8f0; border-radius: 2px; margin-top: 8px; }
    .progress-bar-fill { height: 100%; background: #166534; border-radius: 2px; transition: width 0.3s; }
  </style>
</head>
<body>
  <div class="header">
    <a href="index.html">← All Workflows</a>
    <h1>${escapeHtml(r.name)}</h1>
  </div>
  <div class="container">
    <div class="viewer-card">
      <div class="screenshot-container" id="screenshotContainer">
        ${r.steps.map((s, j) => `<img src="../screenshots/${s.screenshotPath.split('screenshots')[1]?.replace(/\\/g, '/') || ''}" class="${j === 0 ? 'active' : ''}" alt="${escapeHtml(s.name)}" loading="lazy">`).join('')}
      </div>
      <div class="progress-bar"><div class="progress-bar-fill" id="progressFill" style="width: ${100 / r.steps.length}%"></div></div>
      <div class="controls">
        <button id="prevBtn" disabled>← Previous</button>
        <span class="info" id="stepInfo">1 / ${r.steps.length}</span>
        <button id="nextBtn">Next →</button>
        <label class="auto-play">
          <input type="checkbox" id="autoplayToggle"> Auto-play
        </label>
        <button id="resetBtn">↺ Reset</button>
      </div>
      <div class="step-list">
        <h3>Steps</h3>
        <ul id="stepList">
          ${r.steps.map((s, j) => `<li class="${j === 0 ? 'active' : ''}" data-index="${j}">${j + 1}. ${escapeHtml(s.name)}</li>`).join('')}
        </ul>
      </div>
    </div>
  </div>
  <script>
    const steps = ${JSON.stringify(r.steps.map(s => ({ name: s.name })))};
    let current = 0;
    const container = document.getElementById('screenshotContainer');
    const images = container.querySelectorAll('img');
    const stepList = document.getElementById('stepList').querySelectorAll('li');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const stepInfo = document.getElementById('stepInfo');
    const progressFill = document.getElementById('progressFill');
    const autoplayToggle = document.getElementById('autoplayToggle');
    const resetBtn = document.getElementById('resetBtn');
    let autoplayTimer = null;

    function showStep(index) {
      images.forEach((img, i) => img.classList.toggle('active', i === index));
      stepList.forEach((li, i) => li.classList.toggle('active', i === index));
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === images.length - 1;
      stepInfo.textContent = (index + 1) + ' / ' + images.length;
      progressFill.style.width = ((index + 1) / images.length * 100) + '%';
      current = index;
    }

    function nextStep() { if (current < images.length - 1) showStep(current + 1); }
    function prevStep() { if (current > 0) showStep(current - 1); }

    prevBtn.addEventListener('click', prevStep);
    nextBtn.addEventListener('click', nextStep);
    resetBtn.addEventListener('click', () => showStep(0));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') nextStep();
      if (e.key === 'ArrowLeft') prevStep();
    });

    stepList.forEach(li => li.addEventListener('click', () => showStep(parseInt(li.dataset.index))));

    autoplayToggle.addEventListener('change', () => {
      if (autoplayToggle.checked) {
        autoplayTimer = setInterval(() => {
          if (current < images.length - 1) { nextStep(); }
          else { clearInterval(autoplayTimer); autoplayToggle.checked = false; }
        }, 3000);
      } else {
        clearInterval(autoplayTimer);
      }
    });
  </script>
</body>
</html>`;
    fs.writeFileSync(path.join(WORKFLOW_DATA_DIR, `workflow-${i}.html`), workflowHtml);
  }
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function main() {
  console.log('\n=== 🌱 GardenVerse Workflow Screenshot Generator ===\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API URL: ${API_URL}\n`);

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  const workflows = [
    { name: 'Auth', fn: runAuthWorkflow },
    { name: 'Garden', fn: runGardenWorkflow },
    { name: 'Admin', fn: runAdminWorkflow },
    { name: 'Weather', fn: runWeatherWorkflow },
    { name: 'Marketplace', fn: runMarketplaceWorkflow },
    { name: 'Community', fn: runCommunityWorkflow },
    { name: 'AI Scanner', fn: runAiScannerWorkflow },
    { name: 'Invites', fn: runInvitesWorkflow },
    { name: 'Gamification', fn: runGamificationWorkflow },
  ];

  const results: WorkflowResult[] = [];

  for (const wf of workflows) {
    console.log(`  📸 Capturing: ${wf.name}...`);
    try {
      const result = await wf.fn(browser);
      results.push(result);
      console.log(`    ✅ Done — ${result.steps.length} screenshots, ${(result.duration / 1000).toFixed(1)}s`);
    } catch (err) {
      console.error(`    ❌ Failed: ${err}`);
    }
  }

  await browser.close();

  console.log(`\n  📝 Generating HTML pages...`);
  await generateHtml(results);
  console.log(`  ✅ Generated at: workflows-data/index.html`);

  const total = results.reduce((a, r) => a + r.steps.length, 0);
  console.log(`\n  📊 Summary: ${results.length} workflows, ${total} screenshots\n`);
}

main().catch(console.error);
