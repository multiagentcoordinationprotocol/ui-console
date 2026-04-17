# API integration

## Overview

The UI integrates with two upstream services:

1. **Example Service**
2. **Control Plane**

A generic Next.js proxy route keeps browser requests simple and secrets server-side.

## Proxy route

Implemented at:

```text
app/api/proxy/[service]/[...path]/route.ts
```

Supported services:

- `example`
- `control-plane`

## Environment variables

```bash
EXAMPLE_SERVICE_BASE_URL=http://localhost:3000
EXAMPLE_SERVICE_API_KEY=
CONTROL_PLANE_BASE_URL=http://localhost:3001
CONTROL_PLANE_API_KEY=
```

## Auth forwarding behavior

### Example Service

If configured, the proxy adds:

```text
x-api-key: <EXAMPLE_SERVICE_API_KEY>
```

### Control Plane

If configured, the proxy adds:

```text
authorization: Bearer <CONTROL_PLANE_API_KEY>
```

## Example Service endpoints used by the UI

### Scenario discovery

- `GET /packs`
- `GET /packs/:packSlug/scenarios`
- `GET /scenarios` — cross-pack scenario listing with `packSlug`, `policyVersion`, `policyHints` fields

### Agent profiles

- `GET /agents` — list all agent profiles with pre-computed metrics
- `GET /agents/:agentRef` — single agent profile

### Launch setup

- `GET /packs/:packSlug/scenarios/:scenarioSlug/versions/:version/launch-schema?template=` — response now includes `launchSummary.policyHints` (PolicyHints structure)
- `POST /launch/compile`

### Optional one-shot example execution

- `POST /examples/run`

## Control Plane endpoints used by the UI

### Dashboard

- `GET /dashboard/overview` — aggregated KPIs and chart data (includes totalTokens, totalCostUsd when available); supports `timeRange` query param (`24h`, `7d`, `30d`)
- `GET /dashboard/agents/metrics` — per-agent run counts, signal counts, latency, and confidence

### Run lifecycle

- `POST /runs/validate`
- `POST /runs`
- `GET /runs` — supports query params: `status`, `environment`, `search`, `tags`, `limit`, `offset`, `includeArchived`, `scenarioRef`
- `GET /runs/:id`
- `POST /runs/:id/cancel`
- `POST /runs/:id/clone` — accepts optional `{ tags, context }` overrides
- `POST /runs/:id/archive`
- `POST /runs/:id/replay`
- `POST /runs/compare`
- `POST /runs/batch/export` — export multiple runs in one request

### Run state and streaming

- `GET /runs/:id/state` — response now includes optional `policy` projection
- `GET /runs/:id/events` — supports `?limit=<n>` for pagination (default 500)
- `GET /runs/:id/stream` — SSE stream with `?includeSnapshot=true&afterSeq=<n>`
- `GET /runs/:id/export` — full run bundle (run, projection, events, artifacts, metrics)
- `DELETE /runs/:id` — permanently delete a completed/failed/cancelled run

### Session interaction

Under the direct-agent-auth architecture (see `plans/direct-agent-auth.md`), agents emit envelopes
directly to the runtime via `macp-sdk-python` / `macp-sdk-typescript`. The following HTTP
bypass endpoints are **removed** (410 Gone on the control-plane):

- ~~`POST /runs/:id/messages`~~ — replaced by agent `MacpClient.send()`.
- ~~`POST /runs/:id/signal`~~ — replaced by agent `MacpClient.sendSignal()`.
- ~~`POST /runs/:id/context`~~ — replaced by agent-emitted `ContextUpdate` envelope via SDK.

Still supported (scenario-agnostic, control-plane-local):

- `POST /runs/:id/artifacts` — create an artifact (`{ kind, label, uri?, inline? }`)
- `POST /runs/:id/projection/rebuild` — admin: rebuild state projection from events
- `POST /runs/:id/cancel` — proxies to the initiator agent's cancel callback (or direct `CancelSession` when policy-delegated)

### Batch operations

- `POST /runs/batch/cancel` — cancel multiple runs (`{ runIds: string[] }`) → `{ results: [{ runId, ok }] }`
- `POST /runs/batch/archive` — archive multiple runs (`{ runIds: string[] }`) → `{ results: [{ runId, ok }] }`
- `POST /runs/batch/delete` — delete multiple runs (`{ runIds: string[] }`) → `{ results: [{ runId, ok }] }`

### Observability and artifacts

- `GET /runs/:id/metrics` — now includes `promptTokens`, `completionTokens`, `totalTokens`, `estimatedCostUsd`
- `GET /runs/:id/traces`
- `GET /runs/:id/artifacts`
- `GET /runs/:id/messages`
- `GET /metrics` — raw Prometheus metrics
- `GET /audit` — supports `?limit=<n>&offset=<n>` for pagination (default limit 100)

### Runtime metadata

- `GET /runtime/manifest`
- `GET /runtime/modes`
- `GET /runtime/roots`
- `GET /runtime/health`

### Operational admin

- `GET /webhooks` — subscriptions may include `deliveryStats` with succeeded/failed counts
- `POST /webhooks`
- `PATCH /webhooks/:id` — toggle active/paused, update URL or events
- `DELETE /webhooks/:id`
- `POST /admin/circuit-breaker/reset`
- `GET /readyz` — readiness probe with per-subsystem checks

## Client-side integration functions

Located in:

```text
lib/api/client.ts
```

Highlights:

- `listPacks`
- `listScenarios`
- `getLaunchSchema`
- `compileLaunch`
- `runExample` — one-shot bootstrap via Example Service `/examples/run`
- `validateRun`
- `createRun`
- `listRuns`
- `getRun`
- `getRunState`
- `getRunEvents` — accepts optional `limit` parameter (default 500)
- `getRunMetrics`
- `getRunTraces`
- `getRunArtifacts`
- `getRunMessages`
- `cancelRun`
- `cloneRun`
- `archiveRun`
- `createReplay`
- `compareRuns`
- `getAgentProfiles`
- `getAgentProfile`
- `getAgentMetrics` — per-agent metrics from `GET /dashboard/agents/metrics` (CP returns `participantId`; client normalizes to `agentRef`; includes `messages` count; `averageLatencyMs` passed through when available)
- `getRuntimeManifest`
- `getRuntimeModes`
- `getRuntimeRoots`
- `getRuntimeHealth`
- `getDashboardOverview` — returns `degraded` flag when overview endpoint is unavailable
- `getAuditLogs` — accepts optional `limit` and `offset` parameters
- `getLogsData` — convenience wrapper combining event data across runs
- `getTraceData` — convenience wrapper for artifact data
- `getObservabilityRawMetrics` — raw Prometheus metrics text from `/metrics`
- `getTimelineFrame` — state projection at a specific sequence number
- `getWebhooks`
- `createWebhook`
- `updateWebhook`
- `deleteWebhook`
- `resetCircuitBreaker`
- `batchCancelRuns`
- `batchArchiveRuns`
- `batchDeleteRuns`
- `batchExportRuns`
- `exportRunBundle`
- `rebuildProjection`
- `updateRunContext`
- `createArtifact`
- `deleteRun`
- `getReadinessProbe`

The `PolicyHints` type flows through the scenario, launch schema, and run state endpoints. Scenario listings include `policyVersion` and `policyHints` per scenario. The launch schema response carries `launchSummary.policyHints`. Run state projections include an optional `policy` section with `PolicyProjection` and `CommitmentEvaluation` data.

Utility helpers (not network calls):

- `getMockFrames` — demo-mode replay frame source
- `getQuickCompareTarget` — suggests a comparison target run
- `listScenarioRefs` — lists all scenario references

## Response normalization

The API client includes a `normalizeRun()` helper that reconciles differences between the Control Plane's response format and the UI's `RunRecord` type:

- **Pagination unwrapping**: `GET /runs` returns `{ data, total, limit, offset }`. The client unwraps `.data` to return a flat `RunRecord[]`.
- **Source field nesting**: The Control Plane stores `sourceKind` and `sourceRef` as flat fields. The client maps them to `source: { kind, ref }`.
- **Archived timestamp bridge**: The Control Plane archives runs via tags. The client synthesizes `archivedAt` from `tags.includes('archived')` until the Control Plane adds a dedicated column.
- **Validate response mapping**: `POST /runs/validate` returns `{ valid, errors, warnings, runtime }`. The client maps `valid` to `ok` and composes a `ValidateRunResponse`.
- **Cancel/archive envelope mapping**: `POST /runs/:id/cancel` and `POST /runs/:id/archive` return full `RunRecord` objects. The client extracts `{ ok, runId, status }` and `{ ok, runId, archived }` respectively.

## Demo mode

When `NEXT_PUBLIC_MACP_UI_DEMO_MODE=true`, those client functions return mock data instead of making upstream network requests.

This allows:

- product demos
- offline design iteration
- UI development before all services are available

## SSE integration

Live execution uses:

```text
GET /api/proxy/control-plane/runs/:id/stream?includeSnapshot=true&afterSeq=<n>
```

The hook listens for:

- `snapshot`
- `canonical_event`
- `heartbeat`

and tracks connection state in the UI. In demo mode, SSE is simulated with 1600ms frame ticks instead of a real EventSource connection.

## Run launch sequence in the UI

### Standard flow

1. load launch schema
2. compile with Example Service
3. validate with Control Plane
4. submit to Control Plane
5. redirect to live workbench

### One-shot bootstrap flow

1. call Example Service `/examples/run`
2. let Example Service bootstrap and optionally submit on behalf of the UI
3. redirect to returned run ID when available
