import { expect } from '@playwright/test';
import { test, seedTheme, waitForVisualReady, DEFAULT_VOLATILE_SELECTORS } from './fixtures/visual';

/**
 * Interaction baselines — PR-R1.2.
 *
 * Captures stable visual state at mid-interaction moments for the three
 * critical user paths:
 *   1. Launch — form pre-filled via URL params (deterministic).
 *   2. Live run — stream paused after first frame (deterministic).
 *   3. Run detail — node selected, inspector populated (deterministic).
 *
 * Live-run baselines pause the demo-mode SSE ticker before snapshotting so
 * the image is frozen at a known frame.
 */

const LIVE_RUN_ID = '11111111-1111-4111-8111-111111111111';
const COMPLETED_RUN_ID = '22222222-2222-4222-8222-222222222222';

const FLOW_VOLATILE_SELECTORS = [
  ...DEFAULT_VOLATILE_SELECTORS,
  // Live run page shows seq and elapsed counters that tick per frame.
  '.metric-box-value',
  '.react-flow__minimap'
];

test.describe('Interaction baseline — Launch form pre-filled', () => {
  // URL-params path: pack=fraud, scenario=high-value-new-device, version=1.0.0,
  // template=default. Deterministic: NewRunPageContent initializes state from
  // these search params (app/runs/new/page.tsx:48-51).
  const path = '/runs/new?pack=fraud&scenario=high-value-new-device&version=1.0.0&template=default';

  test('dark theme', async ({ page }) => {
    await seedTheme(page, 'dark');
    await page.goto(path);
    await waitForVisualReady(page);
    // Wait for launch schema to resolve (populates the form below the dropdowns).
    await expect(page.getByText(/Launch schema|Execution request|Scenario:/i).first()).toBeVisible({
      timeout: 15_000
    });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('launch-filled-dark.png', {
      fullPage: true,
      mask: FLOW_VOLATILE_SELECTORS.map((selector) => page.locator(selector))
    });
  });

  test('light theme', async ({ page }) => {
    await seedTheme(page, 'light');
    await page.goto(path);
    await waitForVisualReady(page);
    await expect(page.getByText(/Launch schema|Execution request|Scenario:/i).first()).toBeVisible({
      timeout: 15_000
    });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('launch-filled-light.png', {
      fullPage: true,
      mask: FLOW_VOLATILE_SELECTORS.map((selector) => page.locator(selector))
    });
  });
});

test.describe('Interaction baseline — Live run paused', () => {
  const path = `/runs/live/${LIVE_RUN_ID}`;

  async function navigateAndPause(page: import('@playwright/test').Page) {
    await page.goto(path);
    await waitForVisualReady(page);
    // Let at least one SSE frame tick so the graph + event rail are populated.
    // Demo-mode ticker interval is 1600ms (lib/hooks/use-live-run.ts:165).
    await page.waitForTimeout(2000);
    // Click the Pause button to freeze the stream. The label in run-workbench.tsx:336
    // flips between "Pause live stream" / "Resume live stream".
    const pauseBtn = page.getByRole('button', { name: /Pause live stream/i });
    if (await pauseBtn.count()) {
      await pauseBtn.first().click();
    }
    // Debounce to let React re-render the paused state badge.
    await page.waitForTimeout(400);
  }

  test('dark theme', async ({ page }) => {
    await seedTheme(page, 'dark');
    await navigateAndPause(page);
    await expect(page).toHaveScreenshot('live-run-paused-dark.png', {
      fullPage: true,
      mask: FLOW_VOLATILE_SELECTORS.map((selector) => page.locator(selector))
    });
  });

  test('light theme', async ({ page }) => {
    await seedTheme(page, 'light');
    await navigateAndPause(page);
    await expect(page).toHaveScreenshot('live-run-paused-light.png', {
      fullPage: true,
      mask: FLOW_VOLATILE_SELECTORS.map((selector) => page.locator(selector))
    });
  });
});

test.describe('Interaction baseline — Run detail with node selected', () => {
  const path = `/runs/${COMPLETED_RUN_ID}`;

  async function navigateAndSelectNode(page: import('@playwright/test').Page) {
    await page.goto(path);
    await waitForVisualReady(page);
    // Wait for ExecutionGraph to render nodes (React Flow settles async).
    await page.locator('.flow-node-card').first().waitFor({ state: 'visible', timeout: 10_000 });
    // Click the first agent-kind node. The risk-agent node is deterministic
    // in mock data (LIVE_RUN / COMPLETED_RUN scenarios all include it).
    await page.locator('.flow-node-card').first().click();
    await page.waitForTimeout(400);
  }

  test('dark theme', async ({ page }) => {
    await seedTheme(page, 'dark');
    await navigateAndSelectNode(page);
    await expect(page).toHaveScreenshot('run-detail-node-selected-dark.png', {
      fullPage: true,
      mask: FLOW_VOLATILE_SELECTORS.map((selector) => page.locator(selector))
    });
  });

  test('light theme', async ({ page }) => {
    await seedTheme(page, 'light');
    await navigateAndSelectNode(page);
    await expect(page).toHaveScreenshot('run-detail-node-selected-light.png', {
      fullPage: true,
      mask: FLOW_VOLATILE_SELECTORS.map((selector) => page.locator(selector))
    });
  });
});
