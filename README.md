# MACP UI Console

[![CI](https://github.com/multiagentcoordinationprotocol/ui-console/actions/workflows/ci.yml/badge.svg)](https://github.com/multiagentcoordinationprotocol/ui-console/actions/workflows/ci.yml)

Feature-rich Next.js orchestration and observability console for MACP.

This project turns the MACP product blueprint into a working UI scaffold that can:

- launch scenarios from Example Service launch schemas
- compile launch inputs into Control Plane execution requests
- validate and submit runs to the Control Plane
- stream live execution updates over SSE
- visualize multi-agent execution flow graphically
- inspect node-level payloads, logs, signals, artifacts, and metrics
- browse historical runs and compare outcomes
- inspect runtime health, raw metrics, audit logs, and webhook configuration
- run completely in **demo mode** with mock data or against the uploaded services

## What is included

### Core product surfaces

- Dashboard
- Scenario catalog
- Scenario detail pages
- New run launch page
- Live runs page
- Live run workbench
- Historical run detail page
- Run comparison page
- Agent catalog and detail pages
- Logs explorer
- Traces explorer
- Observability dashboard
- Settings / webhooks / preferences page

### Technical foundations

- Next.js App Router project structure
- Generic route-handler proxy under `app/api/proxy/[service]/[...path]`
- Demo mode with rich mock data
- React Query data layer
- Zustand preferences store
- React Flow execution graph
- Recharts metrics cards
- Markdown docs for architecture, integration, and change log

## Quick start

### 1. Copy environment variables

```bash
cp .env.example .env.local
```

### 2. Decide how you want to run the UI

#### Demo mode

Keep this enabled in `.env.local`:

```bash
NEXT_PUBLIC_MACP_UI_DEMO_MODE=true
```

This gives you a complete end-to-end UI experience without starting any backend services.

#### Real integration mode

Set:

```bash
NEXT_PUBLIC_MACP_UI_DEMO_MODE=false
EXAMPLE_SERVICE_BASE_URL=http://localhost:3000
CONTROL_PLANE_BASE_URL=http://localhost:3001
EXAMPLE_SERVICE_API_KEY=
CONTROL_PLANE_API_KEY=
```

Then run the uploaded Example Service and Control Plane locally.

### 3. Install dependencies and start

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment variables

See `.env.example`.

Important values:

- `NEXT_PUBLIC_MACP_UI_DEMO_MODE`
- `EXAMPLE_SERVICE_BASE_URL`
- `EXAMPLE_SERVICE_API_KEY`
- `CONTROL_PLANE_BASE_URL`
- `CONTROL_PLANE_API_KEY`
- `NEXT_PUBLIC_MACP_ENVIRONMENT_LABEL`

## Route map

- `/` — dashboard
- `/scenarios` — scenario catalog
- `/scenarios/[packSlug]/[scenarioSlug]` — scenario detail
- `/runs/new` — launch run
- `/runs/live` — active runs
- `/runs/live/[runId]` — live execution workbench
- `/runs/[runId]` — historical run detail
- `/runs/[runId]/compare/[otherRunId]` — comparison
- `/agents` — agent catalog
- `/agents/[agentId]` — agent detail
- `/logs` — logs / canonical events
- `/traces` — traces / artifacts
- `/observability` — metrics and health
- `/settings` — preferences, webhooks, audit

## Demo mode behavior

The UI includes a built-in mock dataset that simulates:

- packs and scenarios
- launch schemas
- compile results
- live run state frames
- canonical events
- trace artifacts
- metrics
- audit logs
- webhooks
- runtime health

This lets the product surface feel complete before wiring every backend behavior.

## Integration model

The UI assumes:

- Example Service provides scenario discovery and launch compilation
- Control Plane provides run lifecycle, state, events, metrics, traces, and audit/webhook endpoints
- live execution is streamed with SSE

The browser never talks directly to those services. Instead it calls the Next.js proxy route handlers.

## Docs

- `docs/architecture.md`
- `docs/api-integration.md`
- `docs/feature-matrix.md`
- `docs/changelog.md`
- `docs/backend-repo-notes.md`

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

Tests use Vitest + React Testing Library. Test files are co-located with source (`.test.ts` / `.test.tsx`).

## Development workflow

Pre-commit hooks automatically format and lint staged files via Husky + lint-staged.

```bash
npm run format        # Format all files with Prettier
npm run format:check  # Check formatting
npm run lint          # ESLint
npm run typecheck     # TypeScript check
```

## CI/CD

GitHub Actions CI runs on every PR and push to `main`: format check, lint, typecheck, tests, and production build.

A Vercel deploy workflow is available, gated by GitHub Environment approval for secret protection.

## Notes

This project is intentionally **UI-first** and **integration-ready**.

It does **not** modify the uploaded backend repositories. Instead, it aligns the new front end to the endpoints and contracts exposed by those services.
