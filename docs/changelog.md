# Changelog

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
