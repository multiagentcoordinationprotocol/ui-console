import { test, snapshotPage } from './fixtures/visual';

/** Visual baseline — `/agents`. */
test.describe('Agents visual baseline', () => {
  test('dark theme', async ({ page }) => {
    await snapshotPage(page, 'dark', { path: '/agents', name: 'agents-dark' });
  });

  test('light theme', async ({ page }) => {
    await snapshotPage(page, 'light', { path: '/agents', name: 'agents-light' });
  });
});
