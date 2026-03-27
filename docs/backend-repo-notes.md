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

### Observed characteristics

- NestJS service
- local default port 3000
- optional `x-api-key` auth
- includes a fraud showcase scenario pack in the uploaded repo

## Control Plane

### Purpose

- create and manage runs
- expose projected run state for UI rendering
- expose canonical events
- stream live updates over SSE
- expose metrics, traces, artifacts, audit, runtime metadata, webhooks, and admin operations

### Important integration points

- `/runs`
- `/runs/:id`
- `/runs/:id/state`
- `/runs/:id/events`
- `/runs/:id/stream`
- `/runs/:id/metrics`
- `/runs/:id/traces`
- `/runs/:id/artifacts`
- `/runs/:id/messages`
- `/runs/compare`
- `/runtime/*`
- `/audit`
- `/webhooks`
- `/metrics`

### Observed characteristics

- NestJS service
- local default port 3001
- optional Authorization-based API key auth
- normalized live stream with canonical events and state snapshots
- Prometheus-style metrics endpoint available

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
