import { test, snapshotPage } from './fixtures/visual';

/**
 * Visual baselines — scenarios pages.
 *   - /scenarios                             (catalog)
 *   - /scenarios/fraud/high-value-new-device (detail)
 *
 * Scenario ref: matches MOCK_PACKS[0] + MOCK_SCENARIOS.fraud[0] in
 * lib/data/mock-data.ts, so the detail path is deterministic in demo mode.
 */
test.describe('Scenarios catalog visual baseline', () => {
  test('dark theme', async ({ page }) => {
    await snapshotPage(page, 'dark', { path: '/scenarios', name: 'scenarios-dark' });
  });

  test('light theme', async ({ page }) => {
    await snapshotPage(page, 'light', { path: '/scenarios', name: 'scenarios-light' });
  });
});

test.describe('Scenario detail visual baseline', () => {
  const path = '/scenarios/fraud/high-value-new-device';

  test('dark theme', async ({ page }) => {
    await snapshotPage(page, 'dark', { path, name: 'scenario-detail-dark' });
  });

  test('light theme', async ({ page }) => {
    await snapshotPage(page, 'light', { path, name: 'scenario-detail-light' });
  });
});
