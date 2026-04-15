import { test, snapshotPage } from './fixtures/visual';

/** Visual baseline — `/modes`. */
test.describe('Modes visual baseline', () => {
  test('dark theme', async ({ page }) => {
    await snapshotPage(page, 'dark', { path: '/modes', name: 'modes-dark' });
  });

  test('light theme', async ({ page }) => {
    await snapshotPage(page, 'light', { path: '/modes', name: 'modes-light' });
  });
});
