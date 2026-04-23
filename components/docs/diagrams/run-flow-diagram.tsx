export function RunFlowDiagram() {
  const steps = [
    { n: 1, label: 'Compile', service: 'Examples Service', path: '/launch/compile', tone: 'brand' },
    { n: 2, label: 'Validate', service: 'Control Plane', path: '/runs/validate', tone: 'brand' },
    { n: 3, label: 'Submit', service: 'Control Plane', path: 'POST /runs', tone: 'brand' },
    { n: 4, label: 'Stream', service: 'Control Plane', path: '/runs/:id/stream', tone: 'brand' },
    { n: 5, label: 'Workbench', service: 'Browser', path: '/runs/live/:id', tone: 'success' }
  ] as const;

  const viewW = 640;
  const viewH = 200;
  const colW = viewW / steps.length;
  const circleY = 70;
  const circleR = 18;

  const accentFor = (tone: 'brand' | 'success') => (tone === 'success' ? 'var(--success)' : 'var(--brand)');

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="flow-title flow-desc"
      className="docs-diagram"
    >
      <title id="flow-title">Run launch flow</title>
      <desc id="flow-desc">
        Five steps take an operator from a scenario page to a live run workbench: compile on the Examples Service,
        validate and submit to the Control Plane, open the SSE stream, and render the workbench.
      </desc>

      <defs>
        <linearGradient id="flow-dot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--panel)" />
          <stop offset="100%" stopColor="var(--panel-2)" />
        </linearGradient>
      </defs>

      {/* baseline rail */}
      <line x1={colW / 2} y1={circleY} x2={viewW - colW / 2} y2={circleY} stroke="var(--border)" strokeWidth="1.25" />

      {steps.map((step, idx) => {
        const cx = colW / 2 + idx * colW;
        const accent = accentFor(step.tone);
        return (
          <g key={step.n}>
            <circle cx={cx} cy={circleY} r={circleR} fill="url(#flow-dot)" stroke={accent} strokeWidth="1.5" />
            <text x={cx} y={circleY + 5} textAnchor="middle" className="docs-diagram-step-num">
              {step.n}
            </text>
            <text x={cx} y={circleY + 42} textAnchor="middle" className="docs-diagram-title">
              {step.label}
            </text>
            <text x={cx} y={circleY + 60} textAnchor="middle" className="docs-diagram-subtitle">
              {step.service}
            </text>
            <text x={cx} y={circleY + 76} textAnchor="middle" className="docs-diagram-mono">
              {step.path}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
