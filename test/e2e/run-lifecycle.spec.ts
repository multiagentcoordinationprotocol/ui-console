import { test, expect, waitForPageReady, expectNoErrors } from './fixtures/app-fixture';

test.describe.serial('Run lifecycle -- critical path', () => {
  let runId: string;

  test('loads launch form with pack and scenario selectors', async ({ page }) => {
    await page.goto('/runs/new');
    await waitForPageReady(page);
    await expectNoErrors(page);

    // The page hero renders <h1>Launch a new scenario</h1>
    await expect(page.getByRole('heading', { name: 'Launch a new scenario' })).toBeVisible();

    // Launch configuration card
    await expect(page.getByRole('heading', { name: 'Launch configuration' })).toBeVisible();

    // Pack selector -- it is a <select class="field-input"> following a <label class="field-label">Pack</label>
    const packLabel = page.locator('label.field-label').filter({ hasText: 'Pack' });
    await expect(packLabel).toBeVisible();
    const packSelect = packLabel.locator('..').locator('select.field-input');
    await expect(packSelect).toBeVisible();
    const packOptions = packSelect.locator('option');
    expect(await packOptions.count()).toBeGreaterThan(0);

    // Scenario selector
    const scenarioLabel = page.locator('label.field-label').filter({ hasText: 'Scenario' });
    await expect(scenarioLabel).toBeVisible();
    const scenarioSelect = scenarioLabel.locator('..').locator('select.field-input');
    await expect(scenarioSelect).toBeVisible();
    expect(await scenarioSelect.locator('option').count()).toBeGreaterThan(0);

    // Version and Template selectors are populated
    const versionLabel = page.locator('label.field-label').filter({ hasText: 'Version' });
    await expect(versionLabel).toBeVisible();
    expect(await versionLabel.locator('..').locator('select.field-input option').count()).toBeGreaterThan(0);

    const templateLabel = page.locator('label.field-label').filter({ hasText: 'Template' });
    await expect(templateLabel).toBeVisible();
    expect(await templateLabel.locator('..').locator('select.field-input option').count()).toBeGreaterThan(0);
  });

  test('compiles launch request', async ({ page }) => {
    await page.goto('/runs/new');
    await waitForPageReady(page);

    // Click "Compile launch" button (rendered by <Button>)
    const compileButton = page.locator('button.button').filter({ hasText: /Compile launch/i });
    await expect(compileButton).toBeVisible();
    await compileButton.click();

    // Wait for the "Compiled execution request" card to show actual JSON content.
    // The JsonViewer renders inside <pre class="json-viewer">.
    // Before compilation it shows the hint text; after it shows "mode".
    await expect(page.locator('pre.json-viewer').filter({ hasText: '"mode"' }).first()).toBeVisible({
      timeout: 30_000
    });
  });

  test('validates execution request', async ({ page }) => {
    await page.goto('/runs/new');
    await waitForPageReady(page);

    // Click "Validate request" button
    const validateButton = page.locator('button.button').filter({ hasText: /Validate request/i });
    await expect(validateButton).toBeVisible();
    await validateButton.click();

    // Wait for the "Validation and bootstrap output" card to show a real result.
    // The validation JSON viewer should no longer contain "null" for validationResult.
    const validationViewer = page.locator('pre.json-viewer').filter({ hasText: 'validationResult' });
    await expect(validationViewer.first()).toBeVisible({ timeout: 30_000 });
  });

  test('submits run and redirects to live workbench', async ({ page }) => {
    await page.goto('/runs/new');
    await waitForPageReady(page);

    // Click "Submit run" button
    const submitButton = page.locator('button.button').filter({ hasText: /Submit run/i });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Wait for navigation to the live run page
    await page.waitForURL(/\/runs\/live\//, { timeout: 60_000 });

    // Extract runId from the URL
    const url = page.url();
    const match = url.match(/\/runs\/live\/([^/?#]+)/);
    expect(match).not.toBeNull();
    runId = match![1];
    expect(runId).toBeTruthy();
  });

  test('live workbench shows execution graph and stream badge', async ({ page }) => {
    test.setTimeout(90_000);
    expect(runId).toBeTruthy();
    await page.goto(`/runs/live/${runId}`);
    await waitForPageReady(page, 60_000);

    // The workbench should have the execution graph section
    await expect(page.getByRole('heading', { name: 'Execution graph and live orchestration view' })).toBeVisible({
      timeout: 30_000
    });

    // Stream badge shows connection status (stream:live, stream:connecting, etc.)
    const streamBadge = page.locator('.badge').filter({ hasText: /stream:/i });
    await expect(streamBadge.first()).toBeVisible({ timeout: 30_000 });

    // The event feed card title should be visible (either "Live event rail" or "Canonical event history")
    const eventFeedTitle = page.getByRole('heading', { name: /Live event rail|Canonical event history/i });
    await expect(eventFeedTitle.first()).toBeVisible({ timeout: 15_000 });
  });

  test('run reaches terminal state', async ({ page }) => {
    test.setTimeout(120_000);
    expect(runId).toBeTruthy();
    await page.goto(`/runs/live/${runId}`);
    await waitForPageReady(page, 60_000);

    // Wait up to 90 seconds for the run status badge to show a terminal state.
    // StatusBadge renders as <span class="badge badge-{tone}">{titleCase(status)}</span>.
    await page
      .locator('.badge')
      .getByText(/Completed|Failed|Cancelled/i)
      .first()
      .waitFor({ state: 'visible', timeout: 90_000 });
  });
});
