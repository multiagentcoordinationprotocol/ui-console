import { test, snapshotPage } from './fixtures/visual';

/** Visual baseline — `/observability`. */
test.describe('Observability visual baseline', () => {
  test('dark theme', async ({ page }) => {
    await snapshotPage(page, 'dark', {
      path: '/observability',
      name: 'observability-dark',
      // Raw Prometheus metrics pre is a <pre> of text with scrape timestamps.
      extraVolatileSelectors: ['pre.json-viewer']
    });
  });

  test('light theme', async ({ page }) => {
    await snapshotPage(page, 'light', {
      path: '/observability',
      name: 'observability-light',
      extraVolatileSelectors: ['pre.json-viewer']
    });
  });
});
