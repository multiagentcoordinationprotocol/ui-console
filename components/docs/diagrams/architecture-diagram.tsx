export function ArchitectureDiagram() {
  return (
    <svg
      viewBox="0 0 720 520"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="arch-diagram-title arch-diagram-desc"
      className="docs-diagram"
    >
      <title id="arch-diagram-title">MACP UI Console — Architecture</title>
      <desc id="arch-diagram-desc">
        Browser calls a Next.js proxy, which forwards to the Examples Service and the Control Plane. The Control Plane
        observes the Runtime over gRPC. Agents authenticate directly to the Runtime via the SDK, bypassing the Control
        Plane.
      </desc>

      <defs>
        <linearGradient id="arch-panel-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--panel)" stopOpacity="0.96" />
          <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.96" />
        </linearGradient>
        <marker
          id="arch-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)" />
        </marker>
        <marker
          id="arch-arrow-brand"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--brand-2)" />
        </marker>
      </defs>

      {/* Row 1: Browser */}
      <g>
        <rect
          x="280"
          y="24"
          width="160"
          height="64"
          rx="18"
          fill="url(#arch-panel-fill)"
          stroke="var(--brand)"
          strokeWidth="1.5"
        />
        <rect x="280" y="24" width="5" height="64" rx="2" fill="var(--brand)" />
        <text x="360" y="52" textAnchor="middle" className="docs-diagram-title">
          Browser
        </text>
        <text x="360" y="72" textAnchor="middle" className="docs-diagram-subtitle">
          React 19 · App Router
        </text>
      </g>

      {/* Edge: Browser → Proxy */}
      <line x1="360" y1="88" x2="360" y2="132" stroke="var(--muted)" strokeWidth="1.25" markerEnd="url(#arch-arrow)" />
      <text x="372" y="114" className="docs-diagram-label">
        HTTP
      </text>

      {/* Row 2: Proxy */}
      <g>
        <rect
          x="200"
          y="132"
          width="320"
          height="68"
          rx="18"
          fill="url(#arch-panel-fill)"
          stroke="var(--border)"
          strokeWidth="1"
        />
        <text x="360" y="160" textAnchor="middle" className="docs-diagram-title">
          Next.js Route Handler Proxy
        </text>
        <text x="360" y="180" textAnchor="middle" className="docs-diagram-mono">
          /api/proxy/{'{'}example,control-plane{'}'}/…
        </text>
      </g>

      {/* Edges: Proxy → ES, Proxy → CP */}
      <path
        d="M 280 200 C 240 230, 200 240, 170 270"
        fill="none"
        stroke="var(--muted)"
        strokeWidth="1.25"
        markerEnd="url(#arch-arrow)"
      />
      <path
        d="M 440 200 C 480 230, 520 240, 550 270"
        fill="none"
        stroke="var(--muted)"
        strokeWidth="1.25"
        markerEnd="url(#arch-arrow)"
      />

      {/* Row 3: Examples Service + Control Plane */}
      <g>
        <rect
          x="60"
          y="272"
          width="220"
          height="76"
          rx="18"
          fill="url(#arch-panel-fill)"
          stroke="var(--border)"
          strokeWidth="1"
        />
        <rect x="60" y="272" width="5" height="76" rx="2" fill="var(--brand)" />
        <text x="170" y="300" textAnchor="middle" className="docs-diagram-title">
          Examples Service
        </text>
        <text x="170" y="318" textAnchor="middle" className="docs-diagram-subtitle">
          catalog · schema · compile
        </text>
        <text x="170" y="336" textAnchor="middle" className="docs-diagram-mono">
          :3000
        </text>
      </g>

      <g>
        <rect
          x="440"
          y="272"
          width="220"
          height="76"
          rx="18"
          fill="url(#arch-panel-fill)"
          stroke="var(--border)"
          strokeWidth="1"
        />
        <rect x="440" y="272" width="5" height="76" rx="2" fill="var(--brand)" />
        <text x="550" y="300" textAnchor="middle" className="docs-diagram-title">
          Control Plane
        </text>
        <text x="550" y="318" textAnchor="middle" className="docs-diagram-subtitle">
          observer · state · SSE
        </text>
        <text x="550" y="336" textAnchor="middle" className="docs-diagram-mono">
          :3001
        </text>
      </g>

      {/* Edge: CP → Runtime (observer gRPC) */}
      <path
        d="M 550 348 C 550 380, 510 400, 470 420"
        fill="none"
        stroke="var(--muted)"
        strokeWidth="1.25"
        markerEnd="url(#arch-arrow)"
      />
      <text x="548" y="388" className="docs-diagram-label">
        gRPC · StreamSession
      </text>
      <text x="548" y="402" className="docs-diagram-label docs-diagram-label-dim">
        (read-only observer)
      </text>

      {/* Row 4: Runtime */}
      <g>
        <rect
          x="280"
          y="412"
          width="160"
          height="68"
          rx="18"
          fill="url(#arch-panel-fill)"
          stroke="var(--brand-2)"
          strokeWidth="1.5"
        />
        <rect x="280" y="412" width="5" height="68" rx="2" fill="var(--brand-2)" />
        <text x="360" y="440" textAnchor="middle" className="docs-diagram-title">
          Runtime
        </text>
        <text x="360" y="460" textAnchor="middle" className="docs-diagram-subtitle">
          Rust · gRPC
        </text>
      </g>

      {/* Agents cluster + dashed edge to Runtime */}
      <g>
        <rect
          x="60"
          y="412"
          width="180"
          height="68"
          rx="18"
          fill="url(#arch-panel-fill)"
          stroke="var(--brand-2)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <rect x="60" y="412" width="5" height="68" rx="2" fill="var(--brand-2)" />
        <text x="150" y="440" textAnchor="middle" className="docs-diagram-title">
          Agents
        </text>
        <text x="150" y="460" textAnchor="middle" className="docs-diagram-subtitle">
          macp-sdk-{'{'}py,ts{'}'}
        </text>
      </g>

      <path
        d="M 240 446 L 280 446"
        stroke="var(--brand-2)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        fill="none"
        markerEnd="url(#arch-arrow-brand)"
      />
      <text x="260" y="432" textAnchor="middle" className="docs-diagram-label docs-diagram-label-accent">
        direct-agent-auth
      </text>
    </svg>
  );
}
