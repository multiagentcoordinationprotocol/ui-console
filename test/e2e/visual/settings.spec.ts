import { test, snapshotPage } from './fixtures/visual';

/** Visual baseline — `/settings`. */
test.describe('Settings visual baseline', () => {
  test('dark theme', async ({ page }) => {
    await snapshotPage(page, 'dark', { path: '/settings', name: 'settings-dark' });
  });

  test('light theme', async ({ page }) => {
    await snapshotPage(page, 'light', { path: '/settings', name: 'settings-light' });
  });
});
