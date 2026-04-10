import { test, expect, waitForPageReady, expectNoErrors } from './fixtures/app-fixture';

test.describe('Dashboard', () => {
  test('displays the hero heading and KPI cards', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
    await expectNoErrors(page);

    // The dashboard hero section renders the main heading
    await expect(page.getByRole('heading', { name: 'Execution orchestration and observability' })).toBeVisible();

    // Four KPI cards are rendered inside .kpi-card containers.
    // With an empty DB the values will be 0, but the cards themselves must render.
    const kpiCards = page.locator('.kpi-card');
    await expect(kpiCards.first()).toBeVisible();
    expect(await kpiCards.count()).toBe(4);

    // Verify the four KPI label texts
    await expect(page.locator('.kpi-label').filter({ hasText: 'Total runs' })).toBeVisible();
    await expect(page.locator('.kpi-label').filter({ hasText: 'Success rate' })).toBeVisible();
    await expect(page.locator('.kpi-label').filter({ hasText: 'Signals emitted' })).toBeVisible();
    await expect(page.locator('.kpi-label').filter({ hasText: 'Total cost' })).toBeVisible();
  });

  test('shows runtime health and service posture section', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // The "Service health and runtime posture" card is rendered as a CardTitle (<h3>)
    await expect(page.getByRole('heading', { name: 'Service health and runtime posture' })).toBeVisible();

    // Metric boxes display runtime information
    const metricBoxes = page.locator('.metric-box');
    await expect(metricBoxes.first()).toBeVisible();

    // Specific metric labels within the health card
    await expect(page.getByText('Runtime kind')).toBeVisible();
    await expect(page.getByText('Active executions')).toBeVisible();
    await expect(page.getByText('Avg execution time')).toBeVisible();
  });

  test('launch scenario button navigates to /runs/new', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // The hero section has a "Launch scenario" link styled as a button
    const launchLink = page.getByRole('link', { name: /Launch scenario/i });
    await expect(launchLink).toBeVisible();
    await launchLink.click();

    await page.waitForURL('**/runs/new**');
    expect(page.url()).toContain('/runs/new');
  });

  test('renders chart containers without errors', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Recharts renders inside .recharts-responsive-container
    // With an empty DB the charts still render (with zero-value data points)
    const chartContainers = page.locator('.recharts-responsive-container');
    await expect(chartContainers.first()).toBeVisible({ timeout: 10_000 });

    // There are 4 chart cards: Run volume trend, Latency and signal trend,
    // Error classes over time, Signal frequency + active runs
    expect(await chartContainers.count()).toBeGreaterThanOrEqual(4);

    // Each chart container should have an SVG element
    const chartSvgs = page.locator('.recharts-responsive-container svg');
    expect(await chartSvgs.count()).toBeGreaterThanOrEqual(4);

    await expectNoErrors(page);
  });

  test('shows Live and recent runs section header', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // SectionHeader renders <h2 class="section-title">Live and recent runs</h2>
    await expect(page.locator('h2.section-title').filter({ hasText: 'Live and recent runs' })).toBeVisible();

    // The RunsTable structure is present even if empty (table with thead)
    const table = page.locator('table.table');
    await expect(table).toBeVisible();
    const headerCells = table.locator('thead th');
    expect(await headerCells.count()).toBeGreaterThanOrEqual(5);
  });

  test('shows audit trail and recently created runs cards', async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);

    // Both bottom-row cards render as CardTitle headings
    await expect(page.getByRole('heading', { name: 'Recent audit trail' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recently created runs' })).toBeVisible();
  });
});
