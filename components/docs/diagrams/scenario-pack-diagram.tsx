export function ScenarioPackDiagram() {
  return (
    <svg
      viewBox="0 0 640 340"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="pack-title pack-desc"
      className="docs-diagram"
    >
      <title id="pack-title">Scenario pack compilation pipeline</title>
      <desc id="pack-desc">
        A pack contains versioned scenarios. The Examples Service compiles user inputs into twin artifacts: a
        scenario-agnostic RunDescriptor for the Control Plane, and a bootstrap plus scenarioSpec for the spawned agents.
      </desc>

      <defs>
        <linearGradient id="pack-node" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--panel)" />
          <stop offset="100%" stopColor="var(--panel-2)" />
        </linearGradient>
        <linearGradient id="pack-compile" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--brand-2)" stopOpacity="0.14" />
        </linearGradient>
        <marker id="pack-tip" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--muted)" />
        </marker>
        <marker id="pack-tip-brand" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--brand)" />
        </marker>
        <marker
          id="pack-tip-brand-2"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill="var(--brand-2)" />
        </marker>
      </defs>

      {/* Row 1: Pack → Scenario → Schema → Compile */}
      <g>
        <rect x="20" y="40" width="110" height="56" rx="12" fill="url(#pack-node)" stroke="var(--border)" />
        <text x="75" y="66" textAnchor="middle" className="docs-diagram-title">
          Pack
        </text>
        <text x="75" y="84" textAnchor="middle" className="docs-diagram-mono">
          pack.yaml
        </text>
      </g>

      <g>
        <rect x="150" y="40" width="120" height="56" rx="12" fill="url(#pack-node)" stroke="var(--border)" />
        <text x="210" y="66" textAnchor="middle" className="docs-diagram-title">
          Scenario
        </text>
        <text x="210" y="84" textAnchor="middle" className="docs-diagram-mono">
          @1.0.0
        </text>
      </g>

      <g>
        <rect x="290" y="40" width="140" height="56" rx="12" fill="url(#pack-node)" stroke="var(--border)" />
        <text x="360" y="66" textAnchor="middle" className="docs-diagram-title">
          Launch Schema
        </text>
        <text x="360" y="84" textAnchor="middle" className="docs-diagram-subtitle">
          inputs · policyHints
        </text>
      </g>

      <g>
        <rect
          x="450"
          y="40"
          width="170"
          height="56"
          rx="12"
          fill="url(#pack-compile)"
          stroke="var(--brand)"
          strokeOpacity="0.5"
        />
        <text x="535" y="66" textAnchor="middle" className="docs-diagram-title">
          Compile
        </text>
        <text x="535" y="84" textAnchor="middle" className="docs-diagram-mono">
          POST /launch/compile
        </text>
      </g>

      {/* Arrows between horizontal steps */}
      <line
        x1="130"
        y1="68"
        x2="150"
        y2="68"
        stroke="var(--muted)"
        strokeOpacity="0.6"
        strokeWidth="1"
        markerEnd="url(#pack-tip)"
      />
      <line
        x1="270"
        y1="68"
        x2="290"
        y2="68"
        stroke="var(--muted)"
        strokeOpacity="0.6"
        strokeWidth="1"
        markerEnd="url(#pack-tip)"
      />
      <line
        x1="430"
        y1="68"
        x2="450"
        y2="68"
        stroke="var(--muted)"
        strokeOpacity="0.6"
        strokeWidth="1"
        markerEnd="url(#pack-tip)"
      />

      {/* Labels for the twin artifacts */}
      <path
        d="M 470 96 Q 430 150 210 180"
        fill="none"
        stroke="var(--brand)"
        strokeOpacity="0.75"
        strokeWidth="1.1"
        markerEnd="url(#pack-tip-brand)"
      />
      <text x="330" y="138" textAnchor="middle" className="docs-diagram-label docs-diagram-label-accent">
        RunDescriptor
      </text>

      <path
        d="M 600 96 Q 640 150 430 180"
        fill="none"
        stroke="var(--brand-2)"
        strokeOpacity="0.7"
        strokeWidth="1.1"
        markerEnd="url(#pack-tip-brand-2)"
      />
      <text x="540" y="138" textAnchor="middle" className="docs-diagram-label docs-diagram-label-accent-2">
        Bootstrap + scenarioSpec
      </text>

      {/* Row 2: destinations — Control Plane + Agents */}
      <g>
        <rect
          x="100"
          y="180"
          width="220"
          height="64"
          rx="14"
          fill="url(#pack-node)"
          stroke="var(--brand)"
          strokeOpacity="0.5"
        />
        <circle cx="118" cy="202" r="4" fill="var(--brand)" />
        <text x="132" y="206" className="docs-diagram-title">
          Control Plane
        </text>
        <text x="118" y="226" className="docs-diagram-subtitle">
          observer-only · creates run record
        </text>
      </g>

      <g>
        <rect
          x="340"
          y="180"
          width="220"
          height="64"
          rx="14"
          fill="url(#pack-node)"
          stroke="var(--brand-2)"
          strokeOpacity="0.5"
          strokeDasharray="4 3"
        />
        <circle cx="358" cy="202" r="4" fill="var(--brand-2)" />
        <text x="372" y="206" className="docs-diagram-title">
          Agents
        </text>
        <text x="358" y="226" className="docs-diagram-subtitle">
          spawned · per-agent JWT + gRPC
        </text>
      </g>

      {/* Convergence — both lead to Runtime Session */}
      <line
        x1="210"
        y1="244"
        x2="210"
        y2="266"
        stroke="var(--muted)"
        strokeOpacity="0.5"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <line
        x1="450"
        y1="244"
        x2="450"
        y2="266"
        stroke="var(--muted)"
        strokeOpacity="0.5"
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      <g>
        <rect x="100" y="266" width="460" height="50" rx="14" fill="url(#pack-node)" stroke="var(--border)" />
        <text x="330" y="290" textAnchor="middle" className="docs-diagram-title">
          Runtime session
        </text>
        <text x="330" y="306" textAnchor="middle" className="docs-diagram-subtitle">
          initiator calls SessionStart · CP subscribes read-only · agents drive envelopes
        </text>
      </g>
    </svg>
  );
}
