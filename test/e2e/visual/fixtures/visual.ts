import { test as base, type Page, expect } from '@playwright/test';

export { expect };

type Theme = 'dark' | 'light';

/**
 * Preferences-store shape persisted to localStorage by Zustand.
 * Matches `AppPreferences` from lib/types.ts + defaults from
 * lib/stores/preferences-store.ts:18. Keep in sync if defaults change.
 */
interface PersistedPrefs {
  state: {
    theme: Theme;
    demoMode: boolean;
    autoFollow: boolean;
    showCriticalPath: boolean;
    showParallelBranches: boolean;
    replaySpeed: number;
    logsDensity: 'compact' | 'comfortable';
    // R3.3 — pin baselines to v1; v2 gets its own baselines post-R6.
    designVersion: 'v1' | 'v2';
  };
  version: 0;
}

function buildPersistedPrefs(theme: Theme): PersistedPrefs {
  return {
    state: {
      theme,
      demoMode: true,
      autoFollow: true,
      showCriticalPath: true,
      showParallelBranches: true,
      replaySpeed: 1,
      logsDensity: 'comfortable',
      // R7.1 — baselines now capture the v2 look (default as of R7.3).
      designVersion: 'v2'
    },
    version: 0
  };
}

/**
 * Seed localStorage before the app bundle loads so the Zustand store
 * rehydrates with the requested theme on first render. Avoids the flash
 * of opposite-theme rendering + `useEffect`-triggered repaint.
 *
 * Also freezes `Date.now()` and `new Date()` to a fixed epoch so mock
 * data (which uses `isoMinutesAgo(N)` → `new Date()`) renders identical
 * timestamps across snapshot runs. Without this, the runs table and
 * logs table drift between captures.
 *
 * Call this BEFORE `page.goto()` on every visual test.
 */
// Frozen clock for deterministic rendering: 2026-04-13T12:00:00.000Z.
// Arbitrary but fixed — picked to be near the date the baselines were
// first captured, so relative timestamps like "3m ago" keep their intent.
const FROZEN_NOW_MS = 1807344000000;

export async function seedTheme(page: Page, theme: Theme) {
  await page.addInitScript(
    ({ prefs, frozenNow }) => {
      window.localStorage.setItem('macp-ui-preferences', JSON.stringify(prefs));

      // Freeze Date so mock data is deterministic. We shim Date.now() and
      // the zero-arg Date constructor — other Date features (parsing a
      // specific ISO string, computing durations between two Dates) keep
      // working since mock data rarely uses them at render time.
      const RealDate = Date;
      class FrozenDate extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(frozenNow);
          } else {
            // Pass through real constructor for all other shapes.
            // @ts-expect-error spread typed as unknown[]
            super(...args);
          }
        }
        static now() {
          return frozenNow;
        }
      }
      // Preserve Date.UTC, Date.parse, etc. by copying static members.
      Object.setPrototypeOf(FrozenDate, RealDate);
      (window as unknown as { Date: typeof Date }).Date = FrozenDate as unknown as typeof Date;
    },
    { prefs: buildPersistedPrefs(theme), frozenNow: FROZEN_NOW_MS }
  );
}

/**
 * Wait for the page to be visually stable before snapshotting.
 * Combines:
 *  - LoadingPanel dismissed (mirrors the pattern in
 *    test/e2e/fixtures/app-fixture.ts:waitForPageReady)
 *  - `networkidle` — React Query + SSE settle
 *  - A short debounce — covers post-mount layout shifts (Recharts,
 *    React Flow measuring their containers, etc.)
 */
export async function waitForVisualReady(page: Page, timeout = 30_000) {
  const loadingIndicator = page.getByRole('heading', { name: 'One moment' });
  try {
    await loadingIndicator.first().waitFor({ state: 'visible', timeout: 2000 });
  } catch {
    // Loading may have already completed before we checked
  }
  await loadingIndicator.first().waitFor({ state: 'hidden', timeout });
  await page.waitForLoadState('networkidle', { timeout });
  // Small debounce for any post-mount reflow (charts, graph layout).
  await page.waitForTimeout(300);
}

/**
 * Selectors whose content is inherently non-deterministic across runs
 * (relative timestamps, live-ticking counters). Used as default `mask:`
 * entries in {@link snapshotPage}. Page-specific specs can extend this.
 *
 * Masked elements render as solid pink rectangles in the snapshot — the
 * surrounding layout is captured but the text content is ignored.
 */
export const DEFAULT_VOLATILE_SELECTORS = [
  // Relative timestamps like "3m ago" recompute against new Date()
  '.run-time',
  '.kpi-meta',
  '.audit-time',
  '.list-item-meta',
  // Catch any ad-hoc "x ago" text
  'text=/\\b\\d+[smhd]\\s+ago\\b/i'
];

interface SnapshotOptions {
  /** URL path to navigate to — must start with "/". */
  path: string;
  /** Filename (without extension); Playwright adds the OS suffix. */
  name: string;
  /** Extra selectors to mask in addition to the defaults. */
  extraVolatileSelectors?: string[];
  /** Override to `false` for viewport-only snapshot (e.g., fold-above tests). */
  fullPage?: boolean;
}

/**
 * Navigate to `path`, wait for visual readiness, and snapshot the page in
 * the given theme. Defaults: `fullPage: true`, masks the default volatile
 * selectors above.
 *
 * Call this from a test already inside a `test.describe` block so the
 * snapshot filename inherits the describe title.
 *
 * Usage:
 *   test('dark theme', async ({ page }) => {
 *     await snapshotPage(page, 'dark', {
 *       path: '/scenarios',
 *       name: 'scenarios-dark'
 *     });
 *   });
 */
export async function snapshotPage(page: Page, theme: Theme, options: SnapshotOptions) {
  const { path, name, extraVolatileSelectors = [], fullPage = true } = options;

  await seedTheme(page, theme);
  await page.goto(path);
  await waitForVisualReady(page);

  const allVolatile = [...DEFAULT_VOLATILE_SELECTORS, ...extraVolatileSelectors];

  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage,
    mask: allVolatile.map((selector) => page.locator(selector))
  });
}

export const test = base;
