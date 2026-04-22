import { test, snapshotPage } from './fixtures/visual';

/**
 * Visual baselines — /policies list + /policies/[policyId] detail.
 *
 * Detail path uses `policy.default` — a runtime policy always present in
 * mock data (see lib/data/mock-data.ts MOCK_RUNTIME_POLICIES).
 */
test.describe('Policies list visual baseline', () => {
  test('dark theme', async ({ page }) => {
    await snapshotPage(page, 'dark', { path: '/policies', name: 'policies-dark' });
  });

  test('light theme', async ({ page }) => {
    await snapshotPage(page, 'light', { path: '/policies', name: 'policies-light' });
  });
});

test.describe('Policy detail visual baseline', () => {
  const path = '/policies/policy.default';

  test('dark theme', async ({ page }) => {
    await snapshotPage(page, 'dark', { path, name: 'policy-detail-dark' });
  });

  test('light theme', async ({ page }) => {
    await snapshotPage(page, 'light', { path, name: 'policy-detail-light' });
  });
});
