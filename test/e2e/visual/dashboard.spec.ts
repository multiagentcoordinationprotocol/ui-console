import { test, snapshotPage } from './fixtures/visual';

/**
 * Visual baseline — Dashboard (`/`).
 *
 * Part of plans/ui-implementation-plan.md → PR-R1.1.
 */
test.describe('Dashboard visual baseline', () => {
  test('dark theme', async ({ page }) => {
    await snapshotPage(page, 'dark', { path: '/', name: 'dashboard-dark' });
  });

  test('light theme', async ({ page }) => {
    await snapshotPage(page, 'light', { path: '/', name: 'dashboard-light' });
  });
});
