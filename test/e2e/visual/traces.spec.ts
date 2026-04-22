import { test, snapshotPage } from './fixtures/visual';

/** Visual baseline — `/traces`. */
test.describe('Traces visual baseline', () => {
  test('dark theme', async ({ page }) => {
    await snapshotPage(page, 'dark', { path: '/traces', name: 'traces-dark' });
  });

  test('light theme', async ({ page }) => {
    await snapshotPage(page, 'light', { path: '/traces', name: 'traces-light' });
  });
});
