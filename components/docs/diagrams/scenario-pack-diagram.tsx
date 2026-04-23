export function ScenarioPackDiagram() {
  return (
    <svg
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="pack-diagram-title pack-diagram-desc"
      className="docs-diagram"
    >
      <title id="pack-diagram-title">Scenario Pack Compilation Pipeline</title>
      <desc id="pack-diagram-desc">
        A pack contains versioned scenarios. Each scenario produces a launch schema; compiling with user inputs emits
        twin artifacts: a scenario-agnostic RunDescriptor sent to the Control Plane and a bootstrap + scenarioSpec
        handed to the spawned agents.
      </desc>

      <defs>
        <linearGradient id="pack-panel-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--panel)" stopOpacity="0.96" />
          <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.96" />
        </linearGradient>
        <marker
          id="pack-arrow"
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
          id="pack-arrow-brand"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--brand)" />
        </marker>
        <marker
          id="pack-arrow-brand-2"
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

      {/* Step 1: Pack */}
      <g transform="translate(20, 40)">
        <rect width="120" height="80" rx="18" fill="url(#pack-panel-fill)" stroke="var(--border)" strokeWidth="1" />
        <rect width="5" height="80" rx="2" fill="var(--brand)" />
        <text x="60" y="36" textAnchor="middle" className="docs-diagram-title">
          Pack
        </text>
        <text x="60" y="56" textAnchor="middle" className="docs-diagram-subtitle">
          fraud, lending, …
        </text>
        <text x="60" y="74" textAnchor="middle" className="docs-diagram-mono">
          pack.yaml
        </text>
      </g>

      {/* Step 2: Scenario version */}
      <g transform="translate(170, 40)">
        <rect width="140" height="80" rx="18" fill="url(#pack-panel-fill)" stroke="var(--border)" strokeWidth="1" />
        <rect width="5" height="80" rx="2" fill="var(--brand)" />
        <text x="70" y="36" textAnchor="middle" className="docs-diagram-title">
          Scenario
        </text>
        <text x="70" y="56" textAnchor="middle" className="docs-diagram-mono">
          @1.0.0
        </text>
        <text x="70" y="74" textAnchor="middle" className="docs-diagram-subtitle">
          templates, inputs
        </text>
      </g>

      {/* Step 3: Launch Schema */}
      <g transform="translate(340, 40)">
        <rect width="140" height="80" rx="18" fill="url(#pack-panel-fill)" stroke="var(--border)" strokeWidth="1" />
        <rect width="5" height="80" rx="2" fill="var(--brand)" />
        <text x="70" y="36" textAnchor="middle" className="docs-diagram-title">
          Launch Schema
        </text>
        <text x="70" y="56" textAnchor="middle" className="docs-diagram-subtitle">
          form · defaults ·
        </text>
        <text x="70" y="74" textAnchor="middle" className="docs-diagram-subtitle">
          policyHints
        </text>
      </g>

      {/* Step 4: Compile */}
      <g transform="translate(510, 40)">
        <rect width="120" height="80" rx="18" fill="url(#pack-panel-fill)" stroke="var(--brand)" strokeWidth="1.5" />
        <rect width="5" height="80" rx="2" fill="var(--brand)" />
        <text x="60" y="36" textAnchor="middle" className="docs-diagram-title">
          Compile
        </text>
        <text x="60" y="56" textAnchor="middle" className="docs-diagram-mono">
          POST /launch
        </text>
        <text x="60" y="74" textAnchor="middle" className="docs-diagram-mono">
          /compile
        </text>
      </g>

      {/* Arrows between horizontal steps */}
      <line x1="144" y1="80" x2="166" y2="80" stroke="var(--muted)" strokeWidth="1.25" markerEnd="url(#pack-arrow)" />
      <line x1="314" y1="80" x2="336" y2="80" stroke="var(--muted)" strokeWidth="1.25" markerEnd="url(#pack-arrow)" />
      <line x1="484" y1="80" x2="506" y2="80" stroke="var(--muted)" strokeWidth="1.25" markerEnd="url(#pack-arrow)" />

      {/* Split after compile */}
      <path
        d="M 630 70 C 680 50, 720 30, 740 40"
        fill="none"
        stroke="var(--brand)"
        strokeWidth="1.25"
        markerEnd="url(#pack-arrow-brand)"
      />
      <text x="684" y="36" className="docs-diagram-label docs-diagram-label-accent">
        RunDescriptor
      </text>

      <path
        d="M 630 90 C 680 110, 720 240, 740 248"
        fill="none"
        stroke="var(--brand-2)"
        strokeWidth="1.25"
        markerEnd="url(#pack-arrow-brand-2)"
      />
      <text x="694" y="180" className="docs-diagram-label docs-diagram-label-accent-2">
        Bootstrap +
      </text>
      <text x="694" y="194" className="docs-diagram-label docs-diagram-label-accent-2">
        scenarioSpec
      </text>

      {/* Destinations: CP + Agents */}
      <g transform="translate(740, 20)">
        <rect width="100" height="60" rx="18" fill="url(#pack-panel-fill)" stroke="var(--brand)" strokeWidth="1.5" />
        <rect width="5" height="60" rx="2" fill="var(--brand)" />
        <text x="50" y="30" textAnchor="middle" className="docs-diagram-title">
          Control
        </text>
        <text x="50" y="48" textAnchor="middle" className="docs-diagram-title">
          Plane
        </text>
      </g>

      <g transform="translate(740, 230)">
        <rect
          width="100"
          height="60"
          rx="18"
          fill="url(#pack-panel-fill)"
          stroke="var(--brand-2)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <rect width="5" height="60" rx="2" fill="var(--brand-2)" />
        <text x="50" y="30" textAnchor="middle" className="docs-diagram-title">
          Agents
        </text>
        <text x="50" y="48" textAnchor="middle" className="docs-diagram-subtitle">
          spawned
        </text>
      </g>

      {/* Bottom rail: both feed into Runtime session */}
      <line x1="790" y1="80" x2="790" y2="180" stroke="var(--muted)" strokeWidth="1" strokeDasharray="3 4" />
      <line x1="790" y1="230" x2="790" y2="180" stroke="var(--muted)" strokeWidth="1" strokeDasharray="3 4" />
      <line x1="790" y1="180" x2="150" y2="180" stroke="var(--muted)" strokeWidth="1" strokeDasharray="3 4" />

      <g transform="translate(20, 260)">
        <rect width="760" height="68" rx="18" fill="url(#pack-panel-fill)" stroke="var(--brand-2)" strokeWidth="1.5" />
        <rect width="5" height="68" rx="2" fill="var(--brand-2)" />
        <text x="380" y="32" textAnchor="middle" className="docs-diagram-title">
          Runtime Session
        </text>
        <text x="380" y="54" textAnchor="middle" className="docs-diagram-subtitle">
          initiator opens SessionStart · Control Plane observes read-only · agents drive envelopes
        </text>
      </g>

      <line
        x1="150"
        y1="180"
        x2="150"
        y2="258"
        stroke="var(--muted)"
        strokeWidth="1.25"
        strokeDasharray="3 4"
        markerEnd="url(#pack-arrow)"
      />
    </svg>
  );
}
