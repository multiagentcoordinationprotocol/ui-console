import { defineConfig, devices } from '@playwright/test';

/**
 * Visual regression config — separate from the functional e2e config
 * (`playwright.config.ts`) so baselines stay deterministic.
 *
 * Key differences from the functional config:
 *  - Runs against **demo mode** (deterministic mock data) via `dev:demo`, not
 *    against the Docker-backed real-mode stack.
 *  - Uses a fixed viewport and disables animations to keep snapshots stable
 *    across environments.
 *  - Snapshots live next to each spec file (Playwright default):
 *      test/e2e/visual/<spec>-snapshots/<test-name>-<project>.png
 *    Those PNGs are the source of truth — commit them with the spec.
 *
 * Usage:
 *   npm run test:e2e:visual         # run tests, fail on snapshot drift
 *   npm run test:e2e:visual:update  # regenerate baselines (intentional updates only)
 *
 * Part of the "R1" rollout discipline from plans/ui-improvement-plan.md:
 * no visual change ships until these baselines are green and committed.
 */

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './test/e2e/visual',
  timeout: 60_000,
  expect: {
    timeout: 15_000,
    // Tolerance for sub-pixel font rendering differences across OSes.
    // 0.1% = roughly 1,300 pixels on a 1280×720 frame — small enough to catch
    // real changes, large enough to ignore anti-aliasing jitter.
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
      animations: 'disabled',
      caret: 'hide'
    }
  },
  fullyParallel: false,
  workers: 1,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['html', { open: 'never' }], ['list']] : [['html'], ['list']],
  outputDir: './test/e2e/visual/test-results',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    // Fixed viewport so snapshots are pixel-stable across machines.
    viewport: { width: 1440, height: 900 }
  },

  projects: [
    {
      name: 'visual',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

  webServer: {
    // Demo mode — deterministic mock data (no Docker backends required).
    command: 'npm run dev:demo',
    port: 3000,
    reuseExistingServer: !isCI,
    timeout: 60_000
  }
});
