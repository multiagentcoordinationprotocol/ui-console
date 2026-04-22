import { test, snapshotPage } from './fixtures/visual';

/** Visual baseline — `/logs`. */
test.describe('Logs visual baseline', () => {
  test('dark theme', async ({ page }) => {
    await snapshotPage(page, 'dark', {
      path: '/logs',
      name: 'logs-dark',
      // Log rows have timestamps that render from mock data (deterministic seqs
      // but ISO strings include "now"-based offsets). Mask timestamp cells.
      extraVolatileSelectors: ['table.table tbody td:nth-child(3)']
    });
  });

  test('light theme', async ({ page }) => {
    await snapshotPage(page, 'light', {
      path: '/logs',
      name: 'logs-light',
      extraVolatileSelectors: ['table.table tbody td:nth-child(3)']
    });
  });
});
