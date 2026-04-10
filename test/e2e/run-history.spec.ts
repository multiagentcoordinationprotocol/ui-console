import { test, expect, waitForPageReady, expectNoErrors } from './fixtures/app-fixture';

test.describe('Run history', () => {
  test('run history page loads with correct structure', async ({ page }) => {
    await page.goto('/runs');
    await waitForPageReady(page);
    await expectNoErrors(page);

    // Verify the page heading
    await expect(page.getByRole('heading', { name: 'Run history' })).toBeVisible();

    // Verify the runs table structure is present with a header row
    const table = page.locator('table.table');
    await expect(table).toBeVisible();
    const headerCells = table.locator('thead th');
    // Table columns: checkbox, Run, Status, Scenario, Started, Tokens, Cost, Actions
    expect(await headerCells.count()).toBe(8);
  });

  test('displays KPI cards with aggregate info', async ({ page }) => {
    await page.goto('/runs');
    await waitForPageReady(page);

    // The page has 4 KPI cards: Filtered runs, Avg duration, Tokens, Estimated cost
    const kpiCards = page.locator('.kpi-card');
    await expect(kpiCards.first()).toBeVisible();
    expect(await kpiCards.count()).toBe(4);

    await expect(page.locator('.kpi-label').filter({ hasText: 'Filtered runs' })).toBeVisible();
    await expect(page.locator('.kpi-label').filter({ hasText: 'Avg duration' })).toBeVisible();
    await expect(page.locator('.kpi-label').filter({ hasText: 'Tokens' })).toBeVisible();
    await expect(page.locator('.kpi-label').filter({ hasText: 'Estimated cost' })).toBeVisible();
  });

  test('filter card renders with search, status, and environment controls', async ({ page }) => {
    await page.goto('/runs');
    await waitForPageReady(page);

    // The Filters card
    await expect(page.getByRole('heading', { name: 'Filters' })).toBeVisible();

    // Search input
    const searchInput = page.locator('input.field-input[placeholder*="run id"]');
    await expect(searchInput).toBeVisible();

    // Status select with "All statuses" option
    const statusSelect = page.locator('select.field-input').filter({
      has: page.locator('option', { hasText: 'All statuses' })
    });
    await expect(statusSelect).toBeVisible();

    // Environment select with "All environments" option
    const envSelect = page.locator('select.field-input').filter({
      has: page.locator('option', { hasText: 'All environments' })
    });
    await expect(envSelect).toBeVisible();
  });

  test('status filter can be changed to "Completed"', async ({ page }) => {
    await page.goto('/runs');
    await waitForPageReady(page);

    // Find the Status filter select
    const statusSelect = page.locator('select.field-input').filter({
      has: page.locator('option', { hasText: 'All statuses' })
    });
    await expect(statusSelect).toBeVisible();

    // Change filter to "Completed"
    await statusSelect.selectOption('completed');

    // Allow the list to update
    await page.waitForTimeout(1000);

    // With an empty DB there will be 0 rows, but with data all visible badges
    // should be "Completed" if any rows remain
    const table = page.locator('table.table');
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const badge = rows.nth(i).locator('.badge').first();
        await expect(badge).toContainText(/completed/i);
      }
    }
  });

  test('Historical runs section header is present', async ({ page }) => {
    await page.goto('/runs');
    await waitForPageReady(page);

    // SectionHeader renders <h2 class="section-title">Historical runs</h2>
    await expect(page.locator('h2.section-title').filter({ hasText: 'Historical runs' })).toBeVisible();
  });

  test('Export JSON button is present and triggers download', async ({ page }) => {
    await page.goto('/runs');
    await waitForPageReady(page);

    // The "Export JSON" button
    const exportButton = page.locator('button.button').filter({ hasText: /Export JSON/i });
    await expect(exportButton).toBeVisible();

    // Set up download listener before clicking
    const downloadPromise = page.waitForEvent('download', { timeout: 15_000 });
    await exportButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('New run and Live runs links are visible', async ({ page }) => {
    await page.goto('/runs');
    await waitForPageReady(page);

    await expect(page.getByRole('link', { name: /New run/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Live runs/i }).first()).toBeVisible();
  });
});
