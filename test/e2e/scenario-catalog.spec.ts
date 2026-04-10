import { test, expect, waitForPageReady, expectNoErrors } from './fixtures/app-fixture';

test.describe('Scenario catalog', () => {
  test('loads packs and displays catalog heading', async ({ page }) => {
    await page.goto('/scenarios');
    await waitForPageReady(page);
    await expectNoErrors(page);

    // The page hero renders <h1>Scenario catalog</h1>
    await expect(page.getByRole('heading', { name: 'Scenario catalog' })).toBeVisible();

    // Each pack renders a section with <h2 class="section-title"> containing
    // the pack name, prefixed by an SVG icon.
    const packHeadings = page.locator('h2.section-title');
    await expect(packHeadings.first()).toBeVisible();
    expect(await packHeadings.count()).toBeGreaterThanOrEqual(1);
  });

  test('displays scenario cards within pack grids', async ({ page }) => {
    await page.goto('/scenarios');
    await waitForPageReady(page);

    // Scenarios are rendered as Card components (section.card) inside .grid-2
    // Each ScenarioCard has a card-title (h3), metric-strip, and action buttons
    const scenarioCards = page.locator('.grid-2 section.card');
    await expect(scenarioCards.first()).toBeVisible();
    expect(await scenarioCards.count()).toBeGreaterThanOrEqual(1);

    // Each card has a "Run scenario" link and an "Inspect" link
    const runLinks = page.getByRole('link', { name: /Run scenario/i });
    expect(await runLinks.count()).toBeGreaterThanOrEqual(1);
  });

  test('filter card has search input and pack selector', async ({ page }) => {
    await page.goto('/scenarios');
    await waitForPageReady(page);

    // The filter card has a CardTitle "Filter scenarios"
    await expect(page.getByRole('heading', { name: 'Filter scenarios' })).toBeVisible();

    // Search input with placeholder containing "fraud"
    const searchInput = page.locator('input.field-input[placeholder*="fraud"]');
    await expect(searchInput).toBeVisible();

    // Pack select dropdown
    const packSelect = page
      .locator('select.field-input')
      .filter({ has: page.locator('option', { hasText: 'All packs' }) });
    await expect(packSelect).toBeVisible();
  });

  test('search filters scenario cards', async ({ page }) => {
    await page.goto('/scenarios');
    await waitForPageReady(page);

    // Count initial scenario cards
    const scenarioCards = page.locator('.grid-2 section.card');
    await expect(scenarioCards.first()).toBeVisible();
    const initialCount = await scenarioCards.count();
    expect(initialCount).toBeGreaterThan(0);

    // Type a non-matching search term
    const searchInput = page.locator('input.field-input[placeholder*="fraud"]');
    await searchInput.fill('xyznonexistent');

    // Cards should disappear
    await expect(scenarioCards).toHaveCount(0, { timeout: 5_000 });

    // Clear search and verify cards come back
    await searchInput.clear();
    await expect(scenarioCards.first()).toBeVisible({ timeout: 5_000 });
    const restoredCount = await scenarioCards.count();
    expect(restoredCount).toBe(initialCount);
  });

  test('clicking "Run scenario" navigates to the launch form', async ({ page }) => {
    await page.goto('/scenarios');
    await waitForPageReady(page);

    // Each ScenarioCard has a "Run scenario" link to /runs/new?pack=...&scenario=...
    const launchLink = page.getByRole('link', { name: /Run scenario/i }).first();
    await expect(launchLink).toBeVisible();
    await launchLink.click();

    await page.waitForURL('**/runs/new**');
    expect(page.url()).toContain('/runs/new');
  });

  test('clicking "Inspect" navigates to scenario detail', async ({ page }) => {
    await page.goto('/scenarios');
    await waitForPageReady(page);

    const inspectLink = page.getByRole('link', { name: /Inspect/i }).first();
    await expect(inspectLink).toBeVisible();
    await inspectLink.click();

    // URL should contain /scenarios/<packSlug>/<scenarioSlug>
    await page.waitForURL('**/scenarios/**/**');
  });
});
