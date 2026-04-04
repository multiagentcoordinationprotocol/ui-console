# Feature matrix

## Implemented in this project

| Area | Feature | Status | Notes |
|---|---|---:|---|
| Dashboard | KPI cards | ✅ | Runs, signals, cost, success rate |
| Dashboard | Charts | ✅ | Volume, latency, error, signal trends |
| Dashboard | Service health summary | ✅ | Runtime health surfaced |
| Scenarios | Pack + scenario catalog | ✅ | Search and pack filters |
| Scenarios | Scenario detail | ✅ | Templates, versions, launch schema |
| Run creation | Schema-driven launch form | ✅ | Uses launch schema defaults |
| Run creation | Raw JSON editor | ✅ | Switchable input mode |
| Run creation | Compile launch request | ✅ | Example Service integration |
| Run creation | Validate execution request | ✅ | Control Plane integration |
| Run creation | Submit run | ✅ | Redirects to live workbench |
| Run creation | Example end-to-end bootstrap | ✅ | Optional quick path |
| Run creation | Saved launch presets | ✅ | Save/load/delete from localStorage |
| Live runs | Active runs list | ✅ | Quick watch cards |
| Live runs | SSE auto-reconnect | ✅ | Exponential backoff, heartbeat timeout, bounded buffer |
| Run detail | Graph view | ✅ | React Flow execution graph |
| Run detail | Node inspector | ✅ | Payloads, logs, signals, traces |
| Run detail | Signal rail | ✅ | Side-channel update surface |
| Run detail | Live event rail | ✅ | Canonical events timeline |
| Run detail | Final decision panel | ✅ | Action, confidence, rationale |
| Run detail | Artifacts/messages panel | ✅ | Trace/report bundle visibility |
| Run detail | Replay descriptor request | ✅ | Control Plane replay hookup |
| Run detail | Timeline scrubber | ✅ | Interactive visual replay with frame markers |
| History | Run history page | ✅ | Search + status/environment filtering |
| History | CSV/JSON export | ✅ | Export filtered runs as CSV or JSON |
| Compare | Run comparison page | ✅ | Summary + raw diff payload |
| Compare | Decision comparison | ✅ | Side-by-side confidence bars and reasons |
| Compare | Payload diff viewer | ✅ | Structural diff with color-coded changes |
| Compare | Signal timeline overlay | ✅ | Dual-lane chronological signal view |
| Agents | Agent catalog | ✅ | Search + framework filter, direct Example Service `/agents` endpoint |
| Agents | Agent detail | ✅ | Scenario coverage + related runs, direct `/agents/:agentRef` endpoint |
| Logs | Canonical event explorer | ✅ | Run selection + event filters |
| Traces | Trace summary and artifact explorer | ✅ | Inline span support when available |
| Observability | Runtime health dashboard | ✅ | Manifest, modes, roots, metrics text |
| Observability | Raw metrics surface | ✅ | Prometheus text dump |
| Settings | Preferences store | ✅ | Persisted in local storage |
| Settings | Webhook management | ✅ | Create/delete webhook UI |
| Settings | Circuit breaker reset | ✅ | Admin action surface |
| Settings | Audit log view | ✅ | Recent actions |
| Platform | Demo mode | ✅ | Rich mock dataset |
| Platform | Command palette | ✅ | Route jumping |
| Platform | Theme toggle | ✅ | Dark/light |
| Platform | Real-mode integration | ✅ | Response normalization layer for CP/ES compatibility |
| Platform | Server-side proxy BFF | ✅ | Secret-safe browser integration |
| Platform | Error boundaries | ✅ | Global + per-component crash recovery |
| Platform | CI/CD | ✅ | GitHub Actions: lint, typecheck, test, build |
| Platform | Testing | ✅ | Vitest + React Testing Library, 92 tests |
| Platform | Pre-commit hooks | ✅ | Husky + lint-staged, Prettier + ESLint |

## Partially implemented / foundation laid

| Area | Feature | Status | Notes |
|---|---|---:|---|
| Collaboration | Comments / notes | 🟡 | Not yet built |
| RBAC | Role-aware access control | 🟡 | UI structure can support it later |
| Alerts | Threshold-based notifications | 🟡 | Metrics surfaces are in place |

## Recommended next additions

- annotation / incident-notes layer
- prompt and policy version diffing
- RBAC with route guards
- OTEL trace deep-linking
- simulation / dry-run mode
