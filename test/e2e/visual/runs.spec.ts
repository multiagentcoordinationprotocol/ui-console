import { test, snapshotPage } from './fixtures/visual';

/**
 * Visual baselines — runs pages.
 *   - /runs                                        (history list)
 *   - /runs/new                                    (launch form)
 *   - /runs/[COMPLETED_RUN_ID]                     (run detail — completed)
 *   - /runs/[COMPLETED_RUN_ID]/compare/[FAILED_RUN_ID] (compare view)
 *
 * IDs pulled from lib/data/mock-data.ts:35-37 (LIVE/COMPLETED/FAILED).
 * Completed+failed pair used for compare to keep the snapshot deterministic
 * (no live ticking).
 *
 * Live-run detail (/runs/live/[LIVE_RUN_ID]) is intentionally skipped —
 * the demo-mode frame ticker (lib/api/client.ts getMockFrames → 1600ms)
 * keeps the snapshot unstable. Will capture as an interaction baseline
 * in PR-R1.2 with explicit `await page.waitForTimeout` or by pausing the
 * live stream before snapshot.
 */

const COMPLETED_RUN_ID = '22222222-2222-4222-8222-222222222222';
const FAILED_RUN_ID = '33333333-3333-4333-8333-333333333333';

test.describe('Runs history visual baseline', () => {
  test('dark theme', async ({ page }) => {
    await snapshotPage(page, 'dark', { path: '/runs', name: 'runs-dark' });
  });

  test('light theme', async ({ page }) => {
    await snapshotPage(page, 'light', { path: '/runs', name: 'runs-light' });
  });
});

test.describe('Runs launch (/runs/new) visual baseline', () => {
  test('dark theme', async ({ page }) => {
    await snapshotPage(page, 'dark', { path: '/runs/new', name: 'runs-new-dark' });
  });

  test('light theme', async ({ page }) => {
    await snapshotPage(page, 'light', { path: '/runs/new', name: 'runs-new-light' });
  });
});

test.describe('Run detail visual baseline', () => {
  const path = `/runs/${COMPLETED_RUN_ID}`;

  test('dark theme', async ({ page }) => {
    await snapshotPage(page, 'dark', {
      path,
      name: 'run-detail-dark',
      // React Flow measures the graph container on first layout; give it a beat.
      extraVolatileSelectors: ['.react-flow__minimap']
    });
  });

  test('light theme', async ({ page }) => {
    await snapshotPage(page, 'light', {
      path,
      name: 'run-detail-light',
      extraVolatileSelectors: ['.react-flow__minimap']
    });
  });
});

test.describe('Run compare visual baseline', () => {
  const path = `/runs/${COMPLETED_RUN_ID}/compare/${FAILED_RUN_ID}`;

  test('dark theme', async ({ page }) => {
    await snapshotPage(page, 'dark', { path, name: 'run-compare-dark' });
  });

  test('light theme', async ({ page }) => {
    await snapshotPage(page, 'light', { path, name: 'run-compare-light' });
  });
});
