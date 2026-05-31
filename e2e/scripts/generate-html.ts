import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, basename } from 'path';

const SCREENSHOT_DIR = join(process.cwd(), 'e2e', 'screenshots');
const WORKFLOW_DATA_DIR = join(process.cwd(), 'e2e', 'workflows-data');

interface Step {
  name: string;
  filepath: string;
}

interface Workflow {
  id: string;
  name: string;
  steps: Step[];
  duration: number;
}

const workflows: Workflow[] = [
  {
    id: 'auth', name: 'Authentication Flow',
    steps: ['Login Page', 'Login Form Filled', 'Super Admin Login', 'Super Admin Register', 'Protected Route Redirect'],
  },
  {
    id: 'garden', name: 'Garden Management',
    steps: ['Admin Login', 'Garden Overview', 'Plant Selection', 'Plant Browser', 'Crop Detail'],
  },
  {
    id: 'admin', name: 'Admin Portal',
    steps: ['Admin Login', 'Admin Dashboard', 'Users Management', 'Marketplace', 'Invite Management', 'Super Admin Dashboard'],
  },
  {
    id: 'weather', name: 'Weather Dashboard',
    steps: ['Admin Login', 'Weather Dashboard'],
  },
  {
    id: 'marketplace', name: 'Marketplace',
    steps: ['Admin Login', 'Marketplace Overview', 'Create Listing'],
  },
  {
    id: 'community', name: 'Community',
    steps: ['Admin Login', 'Community Hub', 'Groups'],
  },
  {
    id: 'ai-scanner', name: 'AI Scanner',
    steps: ['Admin Login', 'AI Scanner', 'Scan History'],
  },
  {
    id: 'invites', name: 'Invite System',
    steps: ['Admin Login', 'Invite System', 'Create Invite'],
  },
  {
    id: 'gamification', name: 'Gamification',
    steps: ['Admin Login', 'Gamification Overview'],
  },
];

function findScreenshot(workflowId: string, index: number, stepName: string): string | null {
  const dir = join(SCREENSHOT_DIR, workflowId);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir);
  const num = String(index + 1).padStart(2, '0');
  const expected = files.find(f => f.startsWith(num) && f.includes(stepName.toLowerCase().replace(/[^a-z0-9]/g, '-')));
  if (expected) return join(dir, expected);
  const anyMatch = files.find(f => f.startsWith(num));
  if (anyMatch && !anyMatch.includes('error')) return join(dir, anyMatch);
  return null;
}

function buildWorkflows(): Workflow[] {
  return workflows.map(wf => {
    const steps: Step[] = [];
    for (let i = 0; i < wf.steps.length; i++) {
      const fp = findScreenshot(wf.id, i, wf.steps[i]);
      if (fp) steps.push({ name: wf.steps[i], filepath: fp });
    }
    return { ...wf, steps, duration: steps.length * 5000 + 5000 };
  });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateHtml(results: Workflow[]): void {
  mkdirSync(WORKFLOW_DATA_DIR, { recursive: true });

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
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .status-ok { background: #dcfce7; color: #166534; }
    .status-missing { background: #fef2f2; color: #dc2626; }
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
            ${r.steps.map((s, j) => {
              const fp = findScreenshot(r.id, j, s.name);
              const hasContent = fp ? readFileSync(fp).length > 50000 : false;
              const badge = hasContent ? '<span class="status-badge status-ok">OK</span>' : '<span class="status-badge status-missing">empty</span>';
              return `<li><span class="step-number">${j + 1}</span> ${escapeHtml(s.name)} ${badge}</li>`;
            }).join('')}
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
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; margin-left: 8px; }
    .status-ok { background: #dcfce7; color: #166534; }
    .status-missing { background: #fef2f2; color: #dc2626; }
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
          const filename = basename(s.filepath);
          const hasContent = readFileSync(s.filepath).length > 50000;
          const badge = hasContent ? '<span class="status-badge status-ok">OK</span>' : '<span class="status-badge status-missing">empty</span>';
          return `<img src="../screenshots/${r.id}/${filename}" class="${j === 0 ? 'active' : ''}" alt="${escapeHtml(s.name)}" loading="lazy">`;
        }).join('')}
      </div>
      <div class="progress-bar"><div class="progress-bar-fill" id="progressFill" style="width: ${100 / Math.max(r.steps.length, 1)}%"></div></div>
      <div class="controls">
        <button id="prevBtn" disabled>← Previous</button>
        <span class="info" id="stepInfo">1 / ${r.steps.length}</span>
        <button id="nextBtn">Next →</button>
        <button id="resetBtn">↺ Reset</button>
      </div>
      <div class="step-list">
        <h3>Steps</h3>
        <ul id="stepList">
          ${r.steps.map((s, j) => {
            const hasContent = readFileSync(s.filepath).length > 50000;
            const badge = hasContent ? '✅' : '⚠️';
            return `<li class="${j === 0 ? 'active' : ''}" data-index="${j}">${j + 1}. ${escapeHtml(s.name)} ${badge}</li>`;
          }).join('')}
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
    let autoplayTimer = null;
  </script>
</body>
</html>`;
    writeFileSync(join(WORKFLOW_DATA_DIR, `workflow-${i}.html`), workflowHtml);
  }

  console.log(`\nHTML pages generated at: ${WORKFLOW_DATA_DIR}/`);
  console.log(`Workflows: ${results.length}`);
  console.log(`Total screenshots: ${results.reduce((a, r) => a + r.steps.length, 0)}`);
}

const results = buildWorkflows();
generateHtml(results);
