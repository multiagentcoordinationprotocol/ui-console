export function RunFlowDiagram() {
  const steps = [
    { n: '1', label: 'Compile', service: 'Examples', path: 'POST /launch/compile' },
    { n: '2', label: 'Validate', service: 'Control Plane', path: 'POST /runs/validate' },
    { n: '3', label: 'Submit', service: 'Control Plane', path: 'POST /runs' },
    { n: '4', label: 'Stream', service: 'Control Plane', path: 'GET /runs/:id/stream' },
    { n: '5', label: 'Workbench', service: 'Browser', path: '/runs/live/:id' }
  ];

  const width = 880;
  const height = 240;
  const stepWidth = 140;
  const stepHeight = 110;
  const gap = (width - steps.length * stepWidth) / (steps.length + 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="run-flow-title run-flow-desc"
      className="docs-diagram"
    >
      <title id="run-flow-title">Standard Run Launch Flow</title>
      <desc id="run-flow-desc">
        The five-step flow a user takes from clicking Launch to watching a live run: compile against the Examples
        Service, validate and submit to the Control Plane, open the SSE stream, and render the workbench.
      </desc>

      <defs>
        <linearGradient id="run-panel-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--panel)" stopOpacity="0.96" />
          <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.96" />
        </linearGradient>
        <marker
          id="run-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)" />
        </marker>
      </defs>

      {steps.map((step, idx) => {
        const x = gap + idx * (stepWidth + gap);
        const y = 60;
        const accent =
          step.service === 'Examples' ? 'var(--brand)' : step.service === 'Browser' ? 'var(--success)' : 'var(--brand)';
        return (
          <g key={step.n} transform={`translate(${x}, ${y})`}>
            <rect
              width={stepWidth}
              height={stepHeight}
              rx="18"
              fill="url(#run-panel-fill)"
              stroke="var(--border)"
              strokeWidth="1"
            />
            <rect width="5" height={stepHeight} rx="2" fill={accent} />
            <circle cx="26" cy="24" r="14" fill="var(--panel-2)" stroke={accent} strokeWidth="1.25" />
            <text x="26" y="30" textAnchor="middle" className="docs-diagram-step-num">
              {step.n}
            </text>
            <text x="50" y="30" className="docs-diagram-title">
              {step.label}
            </text>
            <text x={stepWidth / 2} y={58} textAnchor="middle" className="docs-diagram-subtitle">
              {step.service}
            </text>
            <text x={stepWidth / 2} y={82} textAnchor="middle" className="docs-diagram-mono">
              {step.path}
            </text>
          </g>
        );
      })}

      {steps.slice(0, -1).map((_, idx) => {
        const x1 = gap + (idx + 1) * stepWidth + idx * gap;
        const x2 = x1 + gap;
        const y = 60 + stepHeight / 2;
        return (
          <line
            key={idx}
            x1={x1}
            y1={y}
            x2={x2 - 4}
            y2={y}
            stroke="var(--muted)"
            strokeWidth="1.25"
            markerEnd="url(#run-arrow)"
          />
        );
      })}

      <text x={width / 2} y="210" textAnchor="middle" className="docs-diagram-caption">
        Demo mode short-circuits every step to mock data — no backends required.
      </text>
    </svg>
  );
}
