import { test, expect, waitForPageReady, expectNoErrors } from './fixtures/app-fixture';

test.describe.serial('Settings and webhooks', () => {
  const webhookUrl = `https://e2e-test-${Date.now()}.example.com/hook`;

  test('settings page loads and shows heading and preference controls', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageReady(page);
    await expectNoErrors(page);

    // The page heading
    await expect(page.getByRole('heading', { name: 'Settings and integrations' })).toBeVisible();

    // Console preferences card
    await expect(page.getByRole('heading', { name: 'Console preferences' })).toBeVisible();

    // Theme selector
    const themeLabel = page.locator('label.field-label').filter({ hasText: 'Theme' });
    await expect(themeLabel).toBeVisible();
    const themeSelect = themeLabel.locator('..').locator('select.field-input');
    await expect(themeSelect).toBeVisible();

    // Demo mode checkbox in a switch-row (scoped to main content, not topbar)
    const demoModeSwitch = page
      .locator('main label.switch-row, .page-content label.switch-row')
      .filter({ hasText: 'Demo mode' });
    await expect(demoModeSwitch.first()).toBeVisible();

    // Runtime + integration status card
    await expect(page.getByRole('heading', { name: 'Runtime + integration status' })).toBeVisible();
  });

  test('webhook management section is visible', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageReady(page);

    // Webhooks card title (contains icon + text)
    await expect(page.getByRole('heading', { name: /Webhooks/i })).toBeVisible();

    // Webhook URL input
    const urlLabel = page.locator('label.field-label').filter({ hasText: 'Webhook URL' });
    await expect(urlLabel).toBeVisible();

    // Events input
    const eventsLabel = page.locator('label.field-label').filter({ hasText: 'Events' });
    await expect(eventsLabel).toBeVisible();

    // Create webhook button
    const createButton = page.locator('button.button').filter({ hasText: /Create webhook/i });
    await expect(createButton).toBeVisible();

    // Reset circuit breaker button
    const resetButton = page.locator('button.button').filter({ hasText: /Reset circuit breaker/i });
    await expect(resetButton).toBeVisible();
  });

  test('creates a webhook', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageReady(page);

    // Fill in the Webhook URL
    const urlLabel = page.locator('label.field-label').filter({ hasText: 'Webhook URL' });
    const urlInput = urlLabel.locator('..').locator('input.field-input');
    await urlInput.fill(webhookUrl);

    // Fill in events
    const eventsLabel = page.locator('label.field-label').filter({ hasText: 'Events' });
    const eventsInput = eventsLabel.locator('..').locator('input.field-input');
    await eventsInput.fill('run.completed');

    // Click the "Create webhook" button
    const createButton = page.locator('button.button').filter({ hasText: /Create webhook/i });
    await createButton.click();

    // Wait for the webhook to appear in the list
    // The list-item should contain the webhook URL text
    await expect(page.locator('.list-item').filter({ hasText: webhookUrl }).first()).toBeVisible({ timeout: 15_000 });

    // Verify it shows "Active" status badge
    const webhookItem = page.locator('.list-item').filter({ hasText: webhookUrl }).first();
    await expect(webhookItem.locator('.badge').filter({ hasText: /Active/i })).toBeVisible();
  });

  test('toggles webhook to paused', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageReady(page);

    // Find the webhook list item
    const webhookItem = page.locator('.list-item').filter({ hasText: webhookUrl }).first();
    await expect(webhookItem).toBeVisible({ timeout: 15_000 });

    // Click the "Pause" button
    const pauseButton = webhookItem.locator('button.button').filter({ hasText: /Pause/i });
    await expect(pauseButton).toBeVisible();
    await pauseButton.click();

    // Badge should now show "Paused"
    await expect(webhookItem.locator('.badge').filter({ hasText: /Paused/i })).toBeVisible({ timeout: 10_000 });
  });

  test('deletes webhook', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageReady(page);

    // Find the webhook list item
    const webhookItem = page.locator('.list-item').filter({ hasText: webhookUrl }).first();
    await expect(webhookItem).toBeVisible({ timeout: 15_000 });

    // Click the "Remove" button (variant="danger")
    const removeButton = webhookItem.locator('button.button').filter({ hasText: /Remove/i });
    await expect(removeButton).toBeVisible();
    await removeButton.click();

    // Verify the webhook is removed from the list
    await expect(page.locator('.list-item').filter({ hasText: webhookUrl })).toHaveCount(0, { timeout: 10_000 });
  });

  test('audit trail card is present', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageReady(page);

    await expect(page.getByRole('heading', { name: 'Audit trail' })).toBeVisible();
  });

  test('observability page loads health and metrics', async ({ page }) => {
    await page.goto('/observability');
    await waitForPageReady(page);
    await expectNoErrors(page);

    // Page heading
    await expect(page.getByRole('heading', { name: 'Observability', exact: true })).toBeVisible();

    // KPI cards: Runtime health, Total runs, Signals, Registered modes
    await expect(page.locator('.kpi-label').filter({ hasText: 'Runtime health' })).toBeVisible();
    await expect(page.locator('.kpi-label').filter({ hasText: 'Total runs' })).toBeVisible();
    await expect(page.locator('.kpi-label').filter({ hasText: 'Signals' })).toBeVisible();
    await expect(page.locator('.kpi-label').filter({ hasText: 'Registered modes' })).toBeVisible();

    // Runtime health value should be "Healthy" or "Degraded"
    await expect(
      page
        .locator('.kpi-value')
        .filter({ hasText: /Healthy|Degraded/i })
        .first()
    ).toBeVisible();

    // Runtime identity card
    await expect(page.getByRole('heading', { name: 'Runtime identity' })).toBeVisible();

    // Runtime modes card
    await expect(page.getByRole('heading', { name: 'Runtime modes' })).toBeVisible();

    // Raw Prometheus metrics card with a <pre> element
    await expect(page.getByRole('heading', { name: /Raw Prometheus metrics/i })).toBeVisible();
    const metricsCard = page.locator('section.card').filter({
      has: page.getByRole('heading', { name: /Raw Prometheus metrics/i })
    });
    const preTags = metricsCard.locator('pre');
    await expect(preTags.first()).toBeVisible();
    const preContent = await preTags.first().textContent();
    expect(preContent).toBeTruthy();
    expect(preContent!.length).toBeGreaterThan(0);

    // Readiness probe card
    await expect(page.getByRole('heading', { name: /Readiness probe/i })).toBeVisible();

    // Health detail card
    await expect(page.getByRole('heading', { name: /Health detail/i })).toBeVisible();

    // Charts should render
    const chartContainers = page.locator('.recharts-responsive-container');
    await expect(chartContainers.first()).toBeVisible({ timeout: 10_000 });
    expect(await chartContainers.count()).toBeGreaterThanOrEqual(4);
  });
});
