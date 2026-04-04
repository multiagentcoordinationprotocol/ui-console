# Backend repo notes

These notes summarize the uploaded repositories that this UI was aligned against.

## Example Service

### Purpose

- scenario pack catalog
- scenario launch schemas
- compile launch inputs into execution requests
- optional end-to-end example bootstrap flow

### Important integration points

- `/packs`
- `/packs/:packSlug/scenarios`
- `/packs/:packSlug/scenarios/:scenarioSlug/versions/:version/launch-schema`
- `/launch/compile`
- `/examples/run`
- `/agents` — agent profiles with pre-computed metrics (used by agent catalog)
- `/agents/:agentRef` — single agent profile (used by agent detail)

### Observed characteristics

- NestJS service
- local default port 3000
- optional `x-api-key` auth
- includes a fraud showcase scenario pack in the uploaded repo
- four built-in example agents: fraud-agent, growth-agent, compliance-agent, risk-agent
- agent metrics are fetched from the Control Plane and returned alongside agent profiles

## Control Plane

### Purpose

- create and manage runs
- expose projected run state for UI rendering
- expose canonical events
- stream live updates over SSE
- expose metrics, traces, artifacts, audit, runtime metadata, webhooks, and admin operations

### Important integration points

- `/runs` — paginated listing, returns `{ data, total, limit, offset }`
- `/runs/:id` — single run record (flat `sourceKind`/`sourceRef` fields)
- `/runs/:id/state`
- `/runs/:id/events`
- `/runs/:id/stream` — SSE with `snapshot`, `canonical_event`, `heartbeat` events
- `/runs/:id/metrics`
- `/runs/:id/traces`
- `/runs/:id/artifacts`
- `/runs/:id/messages`
- `/runs/:id/cancel` — returns full run record
- `/runs/:id/clone` — returns `{ runId, status, traceId }`
- `/runs/:id/archive` — returns full run record, archives via tag
- `/runs/:id/replay` — returns replay descriptor
- `/runs/validate` — returns `{ valid, errors, warnings, runtime }`
- `/runs/compare`
- `/dashboard/overview` — KPIs and chart data
- `/runtime/*`
- `/audit` — returns `{ data, total }`
- `/webhooks`
- `/metrics` — Prometheus text format

### Response shape notes

The UI client normalizes several response differences:

- **Run listing**: paginated `{ data, total }` — UI unwraps `.data`
- **Run source field**: flat `sourceKind`/`sourceRef` — UI nests into `source: { kind, ref }`
- **Archive**: tag-based (`tags.includes('archived')`) — UI synthesizes `archivedAt`
- **Validate**: `valid` field — UI maps to `ok`
- **Cancel/archive**: returns full run record — UI extracts envelope

### Observed characteristics

- NestJS service with Drizzle ORM and PostgreSQL
- local default port 3001
- optional Bearer token auth
- normalized live stream with canonical events and state snapshots
- Prometheus-style metrics endpoint available
- gRPC integration with Rust runtime
- circuit breaker pattern for runtime resilience

## Runtime

### Purpose

- lower-level execution runtime used by the Control Plane
- mode registry and replay/runtime infrastructure

### Observed characteristics

- Rust implementation in the uploaded repo
- gRPC-facing runtime responsibilities
- useful for future deeper replay and runtime-specific UI extensions

## How the UI uses this information

- Example Service drives catalog + compilation surfaces
- Control Plane drives live execution, history, observability, and admin surfaces
- runtime metadata is exposed through Control Plane runtime endpoints rather than directly from the UI
