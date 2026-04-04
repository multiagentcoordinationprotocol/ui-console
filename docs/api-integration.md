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

### Agent profiles

- `GET /agents` — list all agent profiles with pre-computed metrics
- `GET /agents/:agentRef` — single agent profile

### Launch setup

- `GET /packs/:packSlug/scenarios/:scenarioSlug/versions/:version/launch-schema?template=`
- `POST /launch/compile`

### Optional one-shot example execution

- `POST /examples/run`

## Control Plane endpoints used by the UI

### Dashboard

- `GET /dashboard/overview` — aggregated KPIs and chart data (optional — UI falls back to client-side computation)

### Run lifecycle

- `POST /runs/validate`
- `POST /runs`
- `GET /runs`
- `GET /runs/:id`
- `POST /runs/:id/cancel`
- `POST /runs/:id/clone`
- `POST /runs/:id/archive`
- `POST /runs/:id/replay`
- `POST /runs/compare`

### Run state and streaming

- `GET /runs/:id/state`
- `GET /runs/:id/events`
- `GET /runs/:id/stream`

### Observability and artifacts

- `GET /runs/:id/metrics`
- `GET /runs/:id/traces`
- `GET /runs/:id/artifacts`
- `GET /runs/:id/messages`
- `GET /metrics`
- `GET /audit`

### Runtime metadata

- `GET /runtime/manifest`
- `GET /runtime/modes`
- `GET /runtime/roots`
- `GET /runtime/health`

### Operational admin

- `GET /webhooks`
- `POST /webhooks`
- `DELETE /webhooks/:id`
- `POST /admin/circuit-breaker/reset`

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
- `validateRun`
- `createRun`
- `listRuns`
- `getRun`
- `getRunState`
- `getRunEvents`
- `getRunMetrics`
- `getRunTraces`
- `getRunArtifacts`
- `cancelRun`
- `cloneRun`
- `archiveRun`
- `compareRuns`
- `getAgentProfiles`
- `getAgentProfile`
- `getRuntimeHealth`
- `getDashboardOverview`
- `getAuditLogs`
- `getWebhooks`

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

and tracks connection state in the UI.

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
