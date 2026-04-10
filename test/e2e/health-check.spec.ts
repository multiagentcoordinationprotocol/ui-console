import { test, expect, waitForBackend } from './fixtures/app-fixture';

test.describe('Backend health checks', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await waitForBackend(page, '/api/proxy/control-plane/healthz');
      await waitForBackend(page, '/api/proxy/example/healthz');
    } finally {
      await page.close();
    }
  });

  test('proxy to control-plane is reachable', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/proxy/control-plane/healthz');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('ok', true);
  });

  test('proxy to examples-service is reachable', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/proxy/example/healthz');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('ok', true);
  });

  test('control-plane readiness probe passes', async ({ page }) => {
    const response = await page.request.get('http://localhost:3000/api/proxy/control-plane/readyz');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('ok', true);
  });
});
