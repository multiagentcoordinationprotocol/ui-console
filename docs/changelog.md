# Changelog

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
