/// <reference types="node" />

import { execSync, spawn } from 'child_process';
import * as path from 'path';

interface TestResult {
  suite: string;
  test: string;
  status: 'passed' | 'failed' | 'flaky' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
  video?: string;
}

interface FeedbackItem {
  type: 'UX' | 'DX' | 'SECURITY' | 'PERFORMANCE' | 'ACCESSIBILITY';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file?: string;
  suggestion: string;
}

class AgenticFeedbackLoop {
  private results: TestResult[] = [];
  private feedbackItems: FeedbackItem[] = [];
  private timestamp: string;

  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  async runTestSuite(): Promise<void> {
    console.log('\n=== 🤖 Agentic Feedback Loop ===\n');
    console.log(`Timestamp: ${this.timestamp}\n`);

    try {
      const output = execSync('npx playwright test --reporter=json 2>&1', {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf-8',
        timeout: 300000,
      });
      this.parsePlaywrightOutput(output);
    } catch (err: any) {
      if (err.stdout) {
        this.parsePlaywrightOutput(err.stdout.toString());
      }
    }

    this.analyzeResults();
    this.generateFeedback();
    this.generateReport();
  }

  private parsePlaywrightOutput(output: string): void {
    try {
      const report = JSON.parse(output);
      if (report.suites) {
        for (const suite of report.suites) {
          this.extractTests(suite);
        }
      }
    } catch {
      const passMatches = output.match(/(\d+) passed/g);
      const failMatches = output.match(/(\d+) failed/g);
      const totalPass = passMatches ? parseInt(passMatches[0]) : 0;
      const totalFail = failMatches ? parseInt(failMatches[0]) : 0;

      console.log(`  📊 Raw output: ${totalPass} passed, ${totalFail} failed`);
    }
  }

  private extractTests(suite: any): void {
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests || []) {
          this.results.push({
            suite: suite.title || 'unknown',
            test: spec.title || test.title || 'unknown',
            status: this.mapStatus(test.status),
            duration: test.duration || 0,
          });
        }
      }
    }
    if (suite.suites) {
      for (const sub of suite.suites) {
        this.extractTests(sub);
      }
    }
  }

  private mapStatus(status: string): TestResult['status'] {
    switch (status) {
      case 'passed': return 'passed';
      case 'failed': return 'failed';
      case 'flaky': return 'flaky';
      case 'skipped': return 'skipped';
      default: return 'skipped';
    }
  }

  private analyzeResults(): void {
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const total = this.results.length;

    console.log(`  📈 Results: ${passed}/${total} passed, ${failed} failed\n`);

    this.analyzeAuthFlows();
    this.analyzeUIFlows();
    this.analyzePerformance();
    this.analyzeAccessibility();
  }

  private analyzeAuthFlows(): void {
    const authResults = this.results.filter(r => r.suite.toLowerCase().includes('auth'));
    const authFailed = authResults.filter(r => r.status === 'failed');

    if (authFailed.length > 0) {
      this.feedbackItems.push({
        type: 'UX',
        severity: 'critical',
        message: `${authFailed.length} auth flow tests failed - users may be unable to log in or register`,
        suggestion: 'Verify auth endpoints respond correctly. Check JWT token generation and cookie setting.',
      });
    }
  }

  private analyzeUIFlows(): void {
    const uiResults = this.results.filter(r =>
      r.suite.toLowerCase().includes('admin') ||
      r.suite.toLowerCase().includes('invite') ||
      r.suite.toLowerCase().includes('dashboard')
    );
    const uiFailed = uiResults.filter(r => r.status === 'failed');

    if (uiFailed.length > 0) {
      this.feedbackItems.push({
        type: 'UX',
        severity: 'high',
        message: `${uiFailed.length} UI navigation tests failed - page rendering or routing issue`,
        file: uiFailed[0]?.suite,
        suggestion: 'Check for SSR/CSR hydration errors, verify all page components render without throwing.',
      });
    }

    const slowTests = this.results.filter(r => r.duration > 10000);
    if (slowTests.length > 0) {
      this.feedbackItems.push({
        type: 'PERFORMANCE',
        severity: 'medium',
        message: `${slowTests.length} tests exceeded 10s - slow page load or API response`,
        suggestion: 'Audit API response times, implement loading skeletons, add suspense boundaries.',
      });
    }
  }

  private analyzePerformance(): void {
    const slowResponses = this.results.filter(r => r.duration > 5000);
    if (slowResponses.length > 0) {
      this.feedbackItems.push({
        type: 'PERFORMANCE',
        severity: 'medium',
        message: `${slowResponses.length} tests took >5s - consider optimizing queries and reducing bundle size`,
        suggestion: 'Enable React lazy loading, implement ISR for static pages, add Redis caching.',
      });
    }
  }

  private analyzeAccessibility(): void {
    const totalTests = this.results.length;
    if (totalTests === 0) {
      this.feedbackItems.push({
        type: 'ACCESSIBILITY',
        severity: 'low',
        message: 'No tests were executed - verify test runner configuration',
        suggestion: 'Check Playwright config and ensure test files exist in the correct directory.',
      });
    }
  }

  private generateFeedback(): void {
    if (this.feedbackItems.length === 0) {
      this.feedbackItems.push({
        type: 'UX',
        severity: 'low',
        message: 'All tests passed - system is stable',
        suggestion: 'Continue monitoring. Consider adding more edge case tests for robustness.',
      });
    }
  }

  private generateReport(): void {
    const report = {
      timestamp: this.timestamp,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'passed').length,
        failed: this.results.filter(r => r.status === 'failed').length,
        flaky: this.results.filter(r => r.status === 'flaky').length,
        skipped: this.results.filter(r => r.status === 'skipped').length,
        passRate: this.results.length > 0
          ? `${((this.results.filter(r => r.status === 'passed').length / this.results.length) * 100).toFixed(1)}%`
          : '0%',
      },
      tests: this.results,
      feedback: this.feedbackItems,
      deployReadiness: this.assessDeployReadiness(),
    };

    const fs = require('fs');
    const reportPath = path.resolve(__dirname, '..', '..', 'playwright-report', `feedback-${this.timestamp}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n  📝 Report saved: ${reportPath}\n`);
    console.log(report.feedback.map(f =>
      `  [${f.severity.toUpperCase()}] ${f.type}: ${f.message}\n  → ${f.suggestion}\n`
    ).join('\n'));
    console.log(`  🏁 Deploy Readiness: ${report.deployReadiness.ready ? '✅ READY' : '❌ NOT READY'}`);
    if (!report.deployReadiness.ready) {
      console.log(`  Blockers: ${report.deployReadiness.blockers.length}`);
      report.deployReadiness.blockers.forEach(b => console.log(`    - ${b}`));
    }
    console.log();
  }

  private assessDeployReadiness(): { ready: boolean; blockers: string[] } {
    const blockers: string[] = [];
    const critical = this.feedbackItems.filter(f => f.severity === 'critical');
    const high = this.feedbackItems.filter(f => f.severity === 'high');

    for (const item of critical) blockers.push(`Critical: ${item.message}`);
    for (const item of high) blockers.push(`High: ${item.message}`);

    return { ready: blockers.length === 0, blockers };
  }
}

const loop = new AgenticFeedbackLoop();
loop.runTestSuite().catch(console.error);
