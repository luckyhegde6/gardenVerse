import { chromium, type Browser, type Page } from 'playwright';
import { join, basename } from 'path';
import { mkdirSync, writeFileSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = join(process.cwd(), 'e2e', 'screenshots');
const WORKFLOW_DATA_DIR = join(process.cwd(), 'e2e', 'workflows-data');

interface WorkflowStep {
  name: string;
  action: (page: Page) => Promise<void>;
}

interface WorkflowResult {
  name: string;
  id: string;
  steps: { name: string; filepath: string }[];
  duration: number;
}

mkdirSync(SCREENSHOT_DIR, { recursive: true });
mkdirSync(WORKFLOW_DATA_DIR, { recursive: true });

async function screenshot(page: Page, workflow: string, step: string): Promise<string> {
  const dir = join(SCREENSHOT_DIR, workflow);
  mkdirSync(dir, { recursive: true });
  const filename = `${step.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
  const filepath = join(dir, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

async function runWorkflow(id: string, name: string, steps: WorkflowStep[]): Promise<WorkflowResult> {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const start = Date.now();
  const results: { name: string; filepath: string }[] = [];

  try {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      process.stdout.write(`  [${i + 1}/${steps.length}] ${step.name}... `);
      try {
        await step.action(page);
        await page.waitForTimeout(500);
        const filepath = await screenshot(page, id, `${String(i + 1).padStart(2, '0')}-${step.name}`);
        results.push({ name: step.name, filepath });
        console.log('OK');
      } catch (err) {
        console.log(`FAILED: ${err}`);
        // Still take screenshot of the error state
        const filepath = await screenshot(page, id, `${String(i + 1).padStart(2, '0')}-${step.name}-error`);
        results.push({ name: `${step.name} (error)`, filepath });
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  return { id, name, steps: results, duration: Date.now() - start };
}

function generateHtml(results: WorkflowResult[]): void {
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
    .view-btn { display: inline-block; padding: 8px 16px; background: #166534; color: white; border-radius: 8px; text-decoration: none; font-size: 0.875rem; font-weight: 500; margin-top: 12px; }
    .duration { font-size: 0.8rem; color: #94a3b8; }
    @media (max-width: 768px) { .workflow-grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>GardenVerse</h1>
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
    <h2 style="font-size:1.5rem; margin-bottom: 16px;">Summary</h2>
    <div style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <p style="margin-bottom:8px;">Total Workflows: <strong>${results.length}</strong></p>
      <p style="margin-bottom:8px;">Total Screenshots: <strong>${results.reduce((a, r) => a + r.steps.length, 0)}</strong></p>
      <p>Total Duration: <strong>${(results.reduce((a, r) => a + r.duration, 0) / 1000).toFixed(1)}s</strong></p>
    </div>
  </div>
</body>
</html>`;

  writeFileSync(join(WORKFLOW_DATA_DIR, 'index.html'), indexHtml);

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
        ${r.steps.map((s, j) => {
    const filename = s.filepath.split(/[\\/]/).pop() || '';
    return `<img src="../screenshots/${r.id}/${filename}" class="${j === 0 ? 'active' : ''}" alt="${escapeHtml(s.name)}" loading="lazy">`;
  }).join('')}
      </div>
      <div class="progress-bar"><div class="progress-bar-fill" id="progressFill" style="width: ${100 / r.steps.length}%"></div></div>
      <div class="controls">
        <button id="prevBtn" disabled>← Previous</button>
        <span class="info" id="stepInfo">1 / ${r.steps.length}</span>
        <button id="nextBtn">Next →</button>
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
  </script>
</body>
</html>`;
    writeFileSync(join(WORKFLOW_DATA_DIR, `workflow-${i}.html`), workflowHtml);
  }

  console.log(`\nHTML pages generated at: ${WORKFLOW_DATA_DIR}/`);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ========== Workflow Definitions ==========

async function authWorkflow(): Promise<WorkflowResult> {
  return runWorkflow('auth', 'Authentication Flow', [
    { name: 'Login Page', action: async (page) => { await page.goto(`${BASE_URL}/login`); await page.waitForLoadState('networkidle'); } },
    { name: 'Login Form Filled', action: async (page) => { await page.fill('input[type="email"]', 'admin@gardenverse.vercel.app'); await page.fill('input[type="password"]', 'Password123'); } },
    { name: 'Super Admin Login', action: async (page) => { await page.goto(`${BASE_URL}/super-admin`); await page.waitForLoadState('networkidle'); } },
    { name: 'Super Admin Register', action: async (page) => { const btn = page.locator('button:has-text("Register")'); if (await btn.isVisible()) await btn.click(); await page.waitForTimeout(500); } },
    { name: 'Protected Route Redirect', action: async (page) => { await page.goto(`${BASE_URL}/dashboard`); await page.waitForLoadState('networkidle'); } },
  ]);
}

async function gardenWorkflow(): Promise<WorkflowResult> {
  return runWorkflow('garden', 'Garden Management', [
    { name: 'Admin Login', action: async (page) => { await loginAsAdmin(page); } },
    { name: 'Garden Overview', action: async (page) => { await page.goto(`${BASE_URL}/garden`); await page.waitForLoadState('networkidle'); } },
    { name: 'Plant Selection', action: async (page) => { await page.goto(`${BASE_URL}/garden/plant`); await page.waitForLoadState('networkidle'); } },
    { name: 'Plant Browser', action: async (page) => { await page.goto(`${BASE_URL}/plants`); await page.waitForLoadState('networkidle'); } },
    { name: 'Crop Detail', action: async (page) => { await page.goto(`${BASE_URL}/garden/crop/demo`); await page.waitForLoadState('networkidle'); } },
  ]);
}

async function adminWorkflow(): Promise<WorkflowResult> {
  return runWorkflow('admin', 'Admin Portal', [
    { name: 'Admin Login', action: async (page) => { await loginAsAdmin(page); } },
    { name: 'Admin Dashboard', action: async (page) => { await page.goto(`${BASE_URL}/dashboard`); await page.waitForLoadState('networkidle'); } },
    { name: 'Users Management', action: async (page) => { await page.goto(`${BASE_URL}/users`); await page.waitForLoadState('networkidle'); } },
    { name: 'Marketplace', action: async (page) => { await page.goto(`${BASE_URL}/marketplace`); await page.waitForLoadState('networkidle'); } },
    { name: 'Invite Management', action: async (page) => { await page.goto(`${BASE_URL}/invites`); await page.waitForLoadState('networkidle'); } },
    { name: 'Super Admin Dashboard', action: async (page) => { await page.goto(`${BASE_URL}/super-admin/dashboard`); await page.waitForLoadState('networkidle'); } },
  ]);
}

async function weatherWorkflow(): Promise<WorkflowResult> {
  return runWorkflow('weather', 'Weather Dashboard', [
    { name: 'Admin Login', action: async (page) => { await loginAsAdmin(page); } },
    { name: 'Weather Dashboard', action: async (page) => { await page.goto(`${BASE_URL}/weather`); await page.waitForLoadState('networkidle'); } },
  ]);
}

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@gardenverse.vercel.app');
  await page.fill('input[type="password"]', 'Password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
}

async function marketplaceWorkflow(): Promise<WorkflowResult> {
  return runWorkflow('marketplace', 'Marketplace', [
    { name: 'Admin Login', action: async (page) => { await loginAsAdmin(page); } },
    { name: 'Marketplace Overview', action: async (page) => { await page.goto(`${BASE_URL}/marketplace`); await page.waitForLoadState('networkidle'); } },
    { name: 'Create Listing', action: async (page) => { await page.goto(`${BASE_URL}/marketplace/create`); await page.waitForLoadState('networkidle'); } },
  ]);
}

async function communityWorkflow(): Promise<WorkflowResult> {
  return runWorkflow('community', 'Community', [
    { name: 'Admin Login', action: async (page) => { await loginAsAdmin(page); } },
    { name: 'Community Hub', action: async (page) => { await page.goto(`${BASE_URL}/community`); await page.waitForLoadState('networkidle'); } },
    { name: 'Groups', action: async (page) => { await page.goto(`${BASE_URL}/community/groups`); await page.waitForLoadState('networkidle'); } },
  ]);
}

async function aiScannerWorkflow(): Promise<WorkflowResult> {
  return runWorkflow('ai-scanner', 'AI Scanner', [
    { name: 'Admin Login', action: async (page) => { await loginAsAdmin(page); } },
    { name: 'AI Scanner', action: async (page) => { await page.goto(`${BASE_URL}/ai-scanner`); await page.waitForLoadState('networkidle'); } },
    { name: 'Scan History', action: async (page) => { await page.goto(`${BASE_URL}/ai-scanner/history`); await page.waitForLoadState('networkidle'); } },
  ]);
}

async function gamificationWorkflow(): Promise<WorkflowResult> {
  return runWorkflow('gamification', 'Gamification', [
    { name: 'Admin Login', action: async (page) => { await loginAsAdmin(page); } },
    { name: 'Gamification Overview', action: async (page) => { await page.goto(`${BASE_URL}/gamification`); await page.waitForLoadState('networkidle'); } },
  ]);
}

async function invitesWorkflow(): Promise<WorkflowResult> {
  return runWorkflow('invites', 'Invite System', [
    { name: 'Admin Login', action: async (page) => { await loginAsAdmin(page); } },
    { name: 'Invite System', action: async (page) => { await page.goto(`${BASE_URL}/invites`); await page.waitForLoadState('networkidle'); } },
    { name: 'Create Invite', action: async (page) => { await page.goto(`${BASE_URL}/invites/create`); await page.waitForLoadState('networkidle'); } },
  ]);
}

// ========== Module Registry ==========

const WORKFLOWS: Record<string, () => Promise<WorkflowResult>> = {
  auth: authWorkflow,
  garden: gardenWorkflow,
  admin: adminWorkflow,
  weather: weatherWorkflow,
  marketplace: marketplaceWorkflow,
  community: communityWorkflow,
  'ai-scanner': aiScannerWorkflow,
  invites: invitesWorkflow,
  gamification: gamificationWorkflow,
};

async function main() {
  const moduleName = process.argv[2]?.toLowerCase();
  const shouldGenerateHtml = process.argv.includes('--html');

  if (!moduleName || moduleName === 'all') {
    console.log('\n=== GardenVerse Module-by-Module E2E Screenshots ===\n');
    console.log(`Base URL: ${BASE_URL}\n`);

    const results: WorkflowResult[] = [];
    const modules = Object.keys(WORKFLOWS);

    for (const mod of modules) {
      process.stdout.write(`\n[${mod.toUpperCase()}] Running ${mod} workflow...\n`);
      try {
        const result = await WORKFLOWS[mod]();
        results.push(result);
        console.log(`  Done: ${result.steps.length} screenshots, ${(result.duration / 1000).toFixed(1)}s`);
      } catch (err) {
        console.error(`  FAILED: ${err}`);
      }
    }

    if (shouldGenerateHtml || results.length > 0) {
      generateHtml(results);
    }

    console.log(`\nSummary: ${results.length}/${modules.length} workflows completed`);
    console.log(`Total screenshots: ${results.reduce((a, r) => a + r.steps.length, 0)}\n`);
    return;
  }

  if (!WORKFLOWS[moduleName]) {
    console.error(`Unknown module: ${moduleName}`);
    console.error(`Available: ${Object.keys(WORKFLOWS).join(', ')}, all`);
    process.exit(1);
  }

  console.log(`\n=== Running: ${moduleName} ===\n`);
  const result = await WORKFLOWS[moduleName]();
  console.log(`\nModule: ${result.name}`);
  console.log(`Steps: ${result.steps.length}`);
  console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`);
  console.log(`Screenshots:`);
  for (const s of result.steps) {
    console.log(`  - ${s.name}: ${s.filepath}`);
  }

  if (shouldGenerateHtml) {
    generateHtml([result]);
  }

  console.log('');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
