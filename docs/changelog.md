# Changelog

## 2026-04-14 (continued) — Phase F + Phase D remainder

Second push on 2026-04-14: completes Phase F (filters + observability) and the
remaining Phase D items (D3 Prometheus parser, D4 tree waterfall, D5 /traces
filters). All items below ship against the backend substantially-complete
plan; no `console` / lint warnings; `npm run build` clean.

### Added

#### API client extensions

- **`listEvents(demoMode, query)`** (`lib/api/client.ts`) — wrapper around BE §4.1 cross-run `/events` endpoint. Query shape: `{ runId, scenarioRef, type, afterTs, beforeTs, afterSeq, limit }`. Returns `{ data, total, nextCursor }`. Demo mode fans out across `MOCK_RUN_EVENTS` with the same filters so `/logs` is exercisable without a backend.
- **`getRunEvents` accepts `RunEventsQuery`** — new fields `afterTs`, `beforeTs`, `type` (csv) map to BE §4.2. Legacy `(runId, demoMode, limit, afterSeq)` call signature preserved for back-compat.
- **`getDashboardOverview(demoMode, query)`** — accepts `{ window, scenarioRef, environment, from, to }` per BE §5.1. Forwards as query params; demo mode filters `MOCK_RUNS` client-side so KPIs respond to the pickers.
- **Chart series extended:** `charts.throughput`, `queueDepth`, `latencyP50/P95/P99`, `cost`, `successRate`, `decisionOutcomePositive`, `decisionOutcomeNegative`, `perScenario` — matches BE §5.2 output.
- **`getCircuitBreakerHistory(demoMode, window?)`** — BE §5.3 endpoint. Returns `CircuitBreakerHistoryEntry[]` (`{ state, enteredAt, reason? }`).
- **`computeDashboardKpis(runs?)`** accepts an optional filtered run list so demo mode can respond to scenario/environment filters.

#### Pure helpers

- **`lib/utils/prometheus.ts`** — `parsePrometheusText()` with full support for counters, gauges, histograms (grouped under base name via `_bucket`/`_sum`/`_count` suffixes), summaries, and escaped quotes in labels. `metricSummaryValue()` returns the one-value-per-row summary (sum of labeled counters, `_count` for histograms). `histogramQuantile(metric, p)` interpolates percentiles from `le` buckets — same algorithm as Grafana's `histogram_quantile`. **13 unit tests.**
- **`lib/utils/traces.ts`** — `buildSpanTree()` builds depth-annotated tree from `span.references[CHILD_OF]`, sorts siblings by `startTime`, treats orphans as additional roots, and counts descendants. `findCriticalPath()` post-order DP finds the longest root-to-leaf chain by cumulative duration. **7 unit tests.**

#### New components

- **`PrometheusMetricsTable`** (`components/observability/prometheus-metrics-table.tsx`) — sortable, filterable table over parsed exposition. Type chips (counter/gauge/histogram/summary), name/help search, click-row → `EventDetailDialog` with per-series breakdown. **4 integration tests.**
- **`CircuitBreakerTimeline`** (`components/observability/circuit-breaker-timeline.tsx`) — horizontal proportional-width state timeline + current-state badge + per-transition table. Freezes `now` at mount for render-purity. **3 tests.**

#### Page rewrites

- **`/logs` (PR-F1)** — rewritten against the cross-run `/events` endpoint:
  - Shared `<RunSelectorFilters>` (scenario + runId + time window)
  - Event type filter with `EVENT_TYPE_GROUPS` incl. new `LLM` group
  - Cursor-based "Load more" pagination (cursors kept as an append-only `useState` array; each new cursor concatenates a dedup'd page)
  - Client-side free-text search over the current page
  - `summarizeEvent()` one-line summary in the Payload column
  - `EventDetailDialog` opens on row click with full payload + Run / Trace / Event id meta rows
  - URL state for every filter → shareable links (runId / scenario / window / type)
  - Empty states + proper loading/error panels

- **`/traces` (PR-D4 + PR-D5)** — tree-indented span waterfall:
  - Calls `buildSpanTree()` + `findCriticalPath()`
  - Per-row depth indentation with `└` connector
  - Critical path segments tinted accent-blue; non-critical use accent-2; errors tinted red
  - Click-a-span → `EventDetailDialog` with Span ID / Trace ID / Start / Status meta
  - Shared `<RunSelectorFilters>` (scenario + status + runId) replaces the single-select dropdown; URL deep-linkable
  - Graceful fallback to flat render when `references[]` is missing (runtime-side fix still pending — BE §10)

- **`/observability` (PR-F3 / PR-F4 / PR-F5 / PR-F6 / PR-D3)**:
  - Shared `<RunSelectorFilters>` (scenario + environment + time window)
  - New chart grid for BE §5.2 series (throughput / queue depth / latency percentiles / cost over time) — each renders only when data is present
  - Three new KPI cards for **p50 / p95 / p99 latency** computed client-side from the Prometheus histogram (PR-F6)
  - `CircuitBreakerTimeline` card (BE §5.3)
  - Raw `<pre>` dump replaced with `PrometheusMetricsTable` (raw link preserved as "Open raw exposition ↗")

- **Signal Rail** (`components/runs/signal-rail.tsx`) — "Open in full view ↗" link to `/logs?runId=...&type=signal.emitted` (PR-B3, the last remaining surface).

### Changed

- Many pages now wrap their content in `<Suspense>` boundaries to satisfy Next.js 16 `useSearchParams` requirements.
- `RunWorkbench` passes `runId` into `SignalRail` (for the deep-link) and `LiveEventFeed`.

### Tests

- **New unit tests:** `prometheus.test.ts` (13), `traces.test.ts` (7), `prometheus-metrics-table.test.tsx` (4), `circuit-breaker-timeline.test.tsx` (3).
- **Full suite now at 371 unit tests** passing (up from 344), across 30 test files.
- 36 visual baselines regenerated and passing deterministically.
- `npm run build` succeeds — all pages render without runtime errors.

### Notes

- Spurious `posttooluse-validate` hook recommendations suggesting Vercel Workflow migration were ignored — `lib/api/client.ts` is a browser-side fetch wrapper, not a serverless handler.

---

## 2026-04-14 — Phase A–E implementation against the enriched backend projection

This release consumes the substantially-complete backend plan (see
`plans/backend-changes-plan.md` status table as of 2026-04-14): state
projection completeness, decision/policy enrichment, canonical event
contracts, cross-run query endpoints, observability enrichment, and the
re-scoped `llm.call.completed` event are all live on the Control Plane.

### Added

#### Shared primitives

- **`<Tooltip>`** (`components/ui/tooltip.tsx`) — CSS-positioned, keyboard-focusable hint primitive. Used by policy panel commitment ids and ready for further adoption.
- **`<EventDetailDialog>`** (`components/ui/event-detail-dialog.tsx`) — shared native-`<dialog>` modal for click-through event / span / metric details. Consumed by LiveEventFeed; ready for `/traces` span details and `/observability` metric details.
- **`<RunSelectorFilters>`** (`components/runs/run-selector-filters.tsx`) — shared filter bar (scenario / runId / status / environment / time-window). Prop-driven rendering so each consumer shows only the controls it needs. Q24 decision: build once, use three times.
- **`<EmptyState>`** (`components/ui/empty-state.tsx`) — standardized icon + title + description + action.
- **`<KpiCard>`** (`components/ui/kpi-card.tsx`) — Syne-displayed KPI tile with optional colored top-stripe accent.
- **`<Panel>`** (`components/ui/panel.tsx`) — replaces ad-hoc `Card + CardHeader + section-actions` composition.
- **`<Breadcrumbs>`** (`components/layout/breadcrumbs.tsx`) — derives a navigation trail from the current route, truncating UUID-like segments.

#### `summarizeEvent()` helper (`lib/utils/events.ts`)

Pure, type-aware helper that produces a one-line semantic summary for a `CanonicalEvent`. Covers the high-volume types (run.*, signal.*, proposal.*, decision.*, policy.*, message.*, tool.*, llm.call.completed) with a generic fallback for everything else. Unit-tested with 11 assertions.

#### LLM interaction visibility (finding #12)

- New `LlmCallCompletedData` type mirrors the CP-synthesized event payload.
- `NodeInspector` gains a conditional "LLM (N)" tab that lists `llm.call.completed` events for the selected participant — each row shows model, token counts, latency, and expandable prompt + response. Honors `redactedPrompt` when the `RedactionService` applied.
- Mock data includes `llm.call.completed` events for the completed fraud run so demo mode exercises the tab.

#### Enriched projection consumption (BE-3 / BE-5 / BE-6 / BE-7 / BE-8 / BE-9)

- **`DecisionProjection.current`** type extended with `proposals[]`, `resolvedAt`, `resolvedBy`, `prompt`. `outcomePositive` widened to `boolean | null` per BE-3.
- **`PolicyProjection`** type extended with `expectedCommitments[]`, `voteTally[]`, `quorumStatus`.
- **Decision panel** (`components/runs/decision-panel.tsx`) rewritten to render the action header with action→tone mapping (approve/step_up/decline → success/warning/danger, neutral fallback), bulleted reasons, contributors table (from `proposals[]`), resolvedBy/at sub-line with deep-link to originating event seq, and the scenario `prompt` labeled distinctly from reasons. Outcome badge branches on `run.status` first, then `outcomePositive: boolean | null`. Removes the literal `'mode'` / `'unknown'` badges (finding #6a).
- **Policy panel** (`components/runs/policy-panel.tsx`) rewritten to show expected commitments with Tooltip-on-hover revealing title + description + required roles, inline tally (allow/deny/quorum), per-commitment evaluation decisions, and `quorumStatus` badge. Falls back to the legacy `commitmentEvaluations[]` table when new fields aren't yet populated. Policy version badge links to `/policies/[policyVersion]`.
- **Run overview card** (`components/runs/run-overview-card.tsx`) — Q1/Q2/Q3 KPI unification. Events + Messages counters now source from the SSE projection during live statuses and from the metrics aggregate once terminal. Tokens/Cost removed from the top strip (moved to the observability summary card).

#### Event feed redesign (PR-B1)

`LiveEventFeed` rewritten:

- Drops the truncated `JSON.stringify()` snippet per row.
- Each row: type badge + seq + semantic summary (`summarizeEvent`) + meta line (timestamp, source).
- Whole row is a button — click opens `<EventDetailDialog>` with the full payload, copy-JSON action, and metadata rows (subject, source, trace id, event id).
- Size selector chips (100 / 500, default 100 per Q13).
- Type filter chips auto-populated from observed event types.
- "Open in full view ↗" link to `/logs?runId=...`.

### Changed

- `RunWorkbench` now passes `state` + `events` + `runId` into `RunOverviewCard`, `DecisionPanel`, and `LiveEventFeed` to support the new projection-consuming behaviour.
- `ExecutionGraph` `outcomePositive` handling widened to accept `boolean | null | undefined` from the enriched decision projection; `null` maps to undefined accent.
- `policy-panel.tsx` removes the `policyHints.type !== 'none'` gate — full rules now render whenever a descriptor is reachable.

### Tests

- New unit tests: `events.test.ts` (11 cases), `run-selector-filters.test.tsx` (5), `event-detail-dialog.test.tsx` (3), `tooltip.test.tsx` (6), `empty-state.test.tsx` (3), `panel.test.tsx` (2), `kpi-card.test.tsx` (4).
- New integration-style tests: `decision-panel.test.tsx` (9 cases covering outcome branching, prompt/reasons/contributors), `policy-panel.test.tsx` (5 cases covering enriched + legacy fallback paths).
- Full suite: **344 unit tests passing** (up from 311), **36 visual baselines passing** deterministically.

---

## Policy governance and RFC-MACP-0012 alignment

### Added

#### Policy hints throughout the UI
- New `PolicyHints` type with governance fields: type, threshold, vetoEnabled, vetoRoles, vetoThreshold, minimumConfidence, designatedRoles
- `PolicyProjection` and `CommitmentEvaluation` types for runtime policy resolution
- `PolicyBadge` component displays policy type with color coding (none/majority/supermajority/unanimous)
- `PolicyPanel` component shows policy version, resolution status, and commitment evaluation table
- Scenario catalog cards now show policy type badge
- Scenario detail page shows full policy governance section (thresholds, veto config, designated roles)
- Launch form displays policy version and description when template is selected
- Run workbench shows PolicyPanel with commitment evaluations when policy data is available

#### Token and cost tracking
- `MetricsSummary` now includes `promptTokens`, `completionTokens`, `totalTokens`, `estimatedCostUsd`
- Run workbench observability summary shows token count and estimated cost when available

#### Mock data updates
- Fraud scenario templates expanded to include `majority-veto` and `unanimous` variants
- All mock scenarios enriched with `policyVersion` and `policyHints`
- Mock run state projections include `policy` section with commitment evaluations
- Mock metrics include token usage and cost
- Policy canonical events (`policy.resolved`, `policy.commitment.evaluated`) added to mock events

### Changed

#### API client
- `normalizeRun()` simplified: `archivedAt` now passed through directly from CP instead of synthesized from tags
- `listRuns()` always sends `limit` and `offset` defaults (required by CP validation)

---

## Deep analysis fixes: gaps, stubs, bugs, and test coverage

### Critical bug fixes

- **Delete run redirect**: `deleteMutation` in RunWorkbench now redirects to `/runs` after successful deletion instead of leaving user on an error page
- **Form reset after send**: SendMessageForm and SendSignalForm in SessionInteractionPanel now reset fields on successful mutation

### Type safety and error handling

- **14 API functions** now have explicit return type annotations with shared interfaces (`MutationAck`, `BatchOperationResult`, `RebuildProjectionResult`, `CircuitBreakerResult`, `RunExampleResult`, `CreateArtifactResult`, `AgentMetricsEntry`) defined in `lib/types.ts`
- **`ApiError` class** added to `lib/api/fetcher.ts` — preserves HTTP status, service, and path for error discrimination
- **`getAgentProfile()`** now only returns `undefined` for 404; re-throws other errors
- **`getDashboardOverview()`** returns `degraded: true` flag when overview endpoint fails; logs warning
- **`getAgentMetrics()`** logs warning on failure instead of silently returning `[]`
- **`normalizeRun()`** validates required fields (`id`, `status`, `runtimeKind`) before processing

### Agent metrics improvements

- `averageLatencyMs` is now optional — displays "N/A" instead of misleading "0ms" when unavailable
- `messages` field from CP response is now mapped through to `AgentMetricsEntry`
- Demo mode returns representative mock metrics instead of empty array

### Pagination and configuration

- `getRunEvents()` accepts optional `limit` parameter (default 500)
- `getAuditLogs()` accepts optional `limit` and `offset` parameters
- `integrations.ts` throws in production if base URLs are not configured; warns on empty auth tokens
- Preset IDs now use `crypto.randomUUID()` instead of `Date.now()`

### UI and component improvements

- Mutation error messages now include backend error details
- ExecutionGraph uses data-driven auto-layout by node kind instead of hardcoded positions
- `formatDateTime()` and `formatChartLabel()` accept optional `timeZone` parameter
- Tabs component: `defaultTab` prop deprecated in favor of `defaultValue`
- Removed unused imports (`Plus`, `createArtifact`, `updateRunContext`) from RunWorkbench

### Documentation

- Added 10 missing API endpoints to `docs/api-integration.md`: session interaction, batch operations, context updates, artifact creation, projection rebuild, run deletion

### Test coverage

- **47 new unit tests** (226 total): real-mode API client tests, SSE hook tests, agent metrics tests
- **6 new integration tests** (85 total): error scenarios for getRun/cancelRun/sendRunMessage (500/422), dashboard degradation, empty results
- **New test files**: `lib/api/client.real-mode.test.ts`, `lib/hooks/use-live-run.test.ts`

---

## Agent metrics normalization and dynamic environment filter

### Fixed

#### Agent metrics field mapping
- `getAgentMetrics()` now normalizes CP response: `participantId` mapped to `agentRef`, `averageLatencyMs` passed through when available (optional)
- Previously the agent catalog page silently failed to enrich profiles because the CP returns `participantId` while the UI looked up by `agentRef`
- Updated integration test fixtures to match actual CP response shape (`participantId`, `messages` fields)

#### Dynamic environment filter
- Runs page environment dropdown now dynamically populated from actual run metadata
- Removed hardcoded `local-dev | stage | prod` options that didn't match real environments
- Supports any environment value including `development` (the default set by Example Service)

---

## Control plane full integration

### Changed

#### Chart timestamp handling

- `LineChartCard` and `BarChartCard` now use `formatChartLabel()` to auto-detect ISO timestamp labels and format them as short date strings (e.g. "Apr 1, 3 PM")
- added `formatChartLabel` utility in `lib/utils/format.ts`

#### Token and cost KPIs from control plane

- `getDashboardOverview()` now extracts `totalTokens` and `totalCostUsd` from CP KPIs when available, instead of hardcoded zeros

#### Server-side run filtering

- runs page now passes `status`, `environment`, and `search` params to `GET /runs` for server-side filtering
- client-side filtering retained as fallback in demo mode

#### Agent metrics enrichment

- added `getAgentMetrics()` API function calling `GET /dashboard/agents/metrics` on the control plane
- agents page fetches real per-agent metrics (runs, signals, latency, confidence) and merges into profiles

#### Clone with overrides

- `cloneRun()` now accepts optional `{ tags, context }` overrides parameter
- added clone UI form in run workbench with tag and context JSON inputs

#### Batch export

- added `batchExportRuns()` API function calling `POST /runs/batch/export`
- added "Export" button to batch toolbar in runs table

#### Webhook delivery stats

- `WebhookSubscription` type now includes optional `deliveryStats` with `total`, `succeeded`, `failed`, `lastDeliveredAt`
- settings page displays delivery counts and last delivery timestamp per webhook

### Testing

- added unit tests for `formatChartLabel`, `getAgentMetrics`, `cloneRun` with overrides, `batchExportRuns`
- added integration tests for batch export, clone with overrides, server-side filters, agent metrics
- updated dashboard integration tests: token/cost KPI extraction from CP, fallback to zero when omitted
- updated backend-response fixtures: `dashboardOverview` includes token/cost KPIs, added `agentMetrics()` and `batchExportResponse()` fixtures

---

## Real-mode integration fixes

### Changed

#### Response normalization layer

- added `normalizeRun()` helper in `lib/api/client.ts` that maps Control Plane response shapes to UI types
- `listRuns()` now unwraps the paginated `{ data, total }` response from the Control Plane
- `getRun()` now normalizes the raw response through `normalizeRun()`
- flat `sourceKind`/`sourceRef` fields are mapped to nested `source: { kind, ref }` on all run records
- `archivedAt` is synthesized from `tags.includes('archived')` as a bridge until the Control Plane adds a dedicated column

#### Validate, cancel, and archive response mapping

- `validateRun()` now maps the Control Plane's `{ valid, errors, warnings, runtime }` response to a typed `ValidateRunResponse` with `ok` field
- `cancelRun()` now extracts `{ ok, runId, status }` from the full run record returned by the Control Plane
- `archiveRun()` now extracts `{ ok, runId, archived }` from the full run record returned by the Control Plane

#### Agent profiles via Example Service

- `getAgentProfiles()` now calls Example Service `GET /agents` directly instead of computing profiles client-side via N+1 cascading calls to packs/scenarios/launch-schemas
- `getAgentProfile()` now calls Example Service `GET /agents/:agentRef` directly with fallback to `undefined`

#### Dashboard overview with Control Plane aggregation

- `getDashboardOverview()` now fetches from Control Plane `GET /dashboard/overview` for KPIs and chart data
- falls back gracefully to client-side computation if the endpoint is unavailable
- Control Plane chart data (`{ labels, data }` arrays) is converted to UI `ChartPoint[]` format

#### Types

- added `ValidateRunResponse` interface to `lib/types.ts`

---

## Initial MACP UI Console delivery

### Added

#### Project foundation

- created a new Next.js App Router project scaffold
- added TypeScript, Tailwind-free custom CSS shell, React Query, Zustand, React Flow, and Recharts integration points
- added route-handler proxy for Example Service and Control Plane

#### Layout and navigation

- app shell with sidebar navigation
- sticky topbar with demo-mode and theme toggles
- command palette with route shortcuts

#### Scenario surfaces

- scenario catalog page
- scenario detail page with version/template switching
- launch schema and defaults inspection

#### Run launch flow

- new-run page with pack/scenario/template selection
- schema-driven input editor
- raw JSON editor
- compile launch flow against Example Service
- validate execution request against Control Plane
- submit run flow
- optional Example Service one-shot bootstrap flow

#### Live and historical run analysis

- live-runs page
- shared run workbench for live and historical views
- execution graph built with React Flow
- node inspector with overview, payloads, signals, logs, traces, and metrics tabs
- live event rail
- signal rail
- final decision panel
- observability summary panel
- artifacts and messages panel
- replay descriptor request panel

#### History and comparison

- run history page with filtering
- run comparison page

#### Agent and observability surfaces

- agent catalog and detail pages
- logs explorer
- traces explorer
- observability dashboard
- settings page with webhook and audit surfaces

#### Demo mode

- rich mock data for packs, scenarios, runs, states, metrics, traces, and audit/webhooks
- simulated live run streaming frames

### Integration alignment

The UI was aligned to the uploaded repositories by using their exposed contracts and endpoints:

- Example Service for scenario/launch compilation
- Control Plane for run lifecycle, state, streaming, metrics, traces, audit, and webhooks
- runtime metadata as surfaced by Control Plane runtime endpoints

### Intentionally not changed

- no modifications were made to the uploaded backend repositories
- no assumptions were added that require backend code changes to render the demo mode
