# Changelog

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
