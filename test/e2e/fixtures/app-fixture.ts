import { test, expect, type Page } from '@playwright/test';

export { test, expect };

/**
 * Wait for the page to finish loading.
 *
 * The LoadingPanel component renders a Card whose CardTitle contains text
 * starting with "Loading". We wait for that to disappear before proceeding.
 * If the loading panel is never visible (page loaded instantly), we still
 * succeed.
 */
export async function waitForPageReady(page: Page, timeout = 30_000) {
  // LoadingPanel renders <h3 class="card-title">Loading ...</h3> with an inner
  // <h4>One moment</h4>. We detect presence by the "One moment" heading.
  const loadingIndicator = page.getByRole('heading', { name: 'One moment' });
  try {
    await loadingIndicator.first().waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    // Loading may have already completed before we checked
  }
  await loadingIndicator.first().waitFor({ state: 'hidden', timeout });
}

/**
 * Assert that no ErrorPanel is visible on the page.
 *
 * The ErrorPanel renders an <h4>Unable to render this view</h4> inside an
 * empty-state container. We check that this heading does not exist.
 */
export async function expectNoErrors(page: Page) {
  const errorHeading = page.getByRole('heading', { name: 'Unable to render this view' });
  await expect(errorHeading).toHaveCount(0);
}

/** Wait for a proxy API response matching the URL pattern. */
export async function waitForApiResponse(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') return url.includes(urlPattern);
      return urlPattern.test(url);
    },
    { timeout: 15_000 }
  );
}

/** Poll a URL until it returns 200 or timeout. Used to wait for backends. */
export async function waitForBackend(page: Page, proxyPath: string, timeout = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await page.request.get(`http://localhost:3000${proxyPath}`);
      if (response.ok()) return;
    } catch {
      // Backend not ready yet
    }
    await page.waitForTimeout(1000);
  }
  throw new Error(`Backend at ${proxyPath} did not become ready within ${timeout}ms`);
}
