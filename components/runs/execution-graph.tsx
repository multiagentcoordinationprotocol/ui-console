'use client';

import { memo, useMemo, type ComponentType } from 'react';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps
} from '@xyflow/react';
import { Bot, CheckCircle2, CircleDashed, Database, Flag, Workflow } from 'lucide-react';
import type { RunStateProjection } from '@/lib/types';
import { getStatusTone, titleCase } from '@/lib/utils/format';

interface FlowNodeData extends Record<string, unknown> {
  title: string;
  subtitle: string;
  status: string;
  kind: string;
  selected?: boolean;
  summary?: string;
  meta?: string[];
}

const kindIcons: Record<string, ComponentType<{ size?: number }>> = {
  start: Flag,
  context: Database,
  agent: Bot,
  decision: Workflow,
  output: CheckCircle2,
  default: CircleDashed
};

const RunGraphNode = memo(function RunGraphNode({ data }: NodeProps<Node<FlowNodeData>>) {
  const Icon = kindIcons[data.kind] ?? kindIcons.default;
  const tone = getStatusTone(data.status);

  return (
    <div className={`flow-node-card ${data.selected ? 'flow-node-card-selected' : ''}`}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="flow-node-title">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Icon size={16} />
          {data.title}
        </span>
        <span className={`badge badge-${tone}`}>{titleCase(data.status)}</span>
      </div>
      <div className="flow-node-body">
        <div>{data.subtitle}</div>
        {data.summary ? <div>{data.summary}</div> : null}
        {(data.meta ?? []).slice(0, 2).map((item) => (
          <div key={item} className="muted small">
            {item}
          </div>
        ))}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
});

const nodeTypes = {
  runNode: RunGraphNode
};

function buildNodePositions(state: RunStateProjection) {
  const base = new Map<string, { x: number; y: number }>([
    ['start', { x: 40, y: 200 }],
    ['context-fetch', { x: 280, y: 200 }],
    ['fraud-agent', { x: 560, y: 70 }],
    ['growth-agent', { x: 560, y: 330 }],
    ['risk-agent', { x: 840, y: 200 }],
    ['decision', { x: 1120, y: 200 }],
    ['final-output', { x: 1380, y: 200 }]
  ]);

  let fallbackRow = 0;
  return state.graph.nodes.map((node) => {
    const position = base.get(node.id) ?? {
      x: 300 + fallbackRow * 220,
      y: 80 + (fallbackRow % 3) * 140
    };
    fallbackRow += base.has(node.id) ? 0 : 1;
    return { id: node.id, position };
  });
}

export function ExecutionGraph({
  state,
  selectedNodeId,
  onSelectNode,
  showCriticalPath = true,
  showParallelBranches = true
}: {
  state: RunStateProjection;
  selectedNodeId?: string;
  onSelectNode?: (nodeId: string) => void;
  showCriticalPath?: boolean;
  showParallelBranches?: boolean;
}) {
  const flowNodes = useMemo<Node<FlowNodeData>[]>(() => {
    const positions = buildNodePositions(state);
    return state.graph.nodes.map((node, index) => {
      const participant = state.participants.find((item) => item.participantId === node.id);
      const latestProgress = [...state.progress.entries]
        .reverse()
        .find(
          (entry) =>
            entry.participantId === node.id || (node.id === 'risk-agent' && entry.participantId === 'risk-agent')
        );
      const signalCount = state.signals.signals.filter((signal) => signal.sourceParticipantId === node.id).length;

      return {
        id: node.id,
        type: 'runNode',
        position: positions[index]?.position ?? { x: index * 200, y: 80 },
        draggable: false,
        selectable: true,
        data: {
          title: titleCase(node.id.replace(/-/g, ' ')),
          subtitle: titleCase(node.kind),
          status: node.status,
          kind: node.kind,
          selected: selectedNodeId === node.id,
          summary: participant?.latestSummary ?? latestProgress?.message,
          meta: [
            participant?.role ? `Role: ${participant.role}` : '',
            latestProgress?.percentage !== undefined ? `Progress: ${latestProgress.percentage}%` : '',
            signalCount > 0 ? `Signals: ${signalCount}` : ''
          ].filter(Boolean)
        }
      } satisfies Node<FlowNodeData>;
    });
  }, [selectedNodeId, state]);

  const flowEdges = useMemo<Edge[]>(() => {
    const counts = new Map<string, number>();

    return state.graph.edges.map((edge, index) => {
      const key = `${edge.from}->${edge.to}`;
      const seen = counts.get(key) ?? 0;
      counts.set(key, seen + 1);
      const parallelOffset = showParallelBranches ? seen * 24 : 0;
      return {
        id: `${edge.from}-${edge.to}-${index}`,
        source: edge.from,
        target: edge.to,
        label: edge.kind,
        animated: showCriticalPath && ['message', 'kickoff', 'proposal'].includes(edge.kind),
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { strokeWidth: edge.kind === 'proposal' ? 2.5 : 1.8 },
        labelStyle: { fill: '#94a3b8', fontSize: 10 },
        data: { parallelOffset },
        zIndex: index + 1,
        type: 'smoothstep'
      } satisfies Edge;
    });
  }, [showCriticalPath, showParallelBranches, state.graph.edges]);

  const summaryCards = [
    { label: 'Participants', value: String(state.participants.length) },
    { label: 'Signals', value: String(state.signals.signals.length) },
    { label: 'Events', value: String(state.timeline.totalEvents) },
    { label: 'Messages', value: `${state.outboundMessages.accepted}/${state.outboundMessages.total}` }
  ];

  return (
    <div className="stack">
      <div className="flow-shell">
        <ReactFlowProvider>
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.12 }}
            nodesDraggable={false}
            nodesConnectable={false}
            onNodeClick={(_, node) => onSelectNode?.(node.id)}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={18} size={1} />
            <MiniMap pannable zoomable />
            <Controls showInteractive={false} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      <div className="flow-meta">
        {summaryCards.map((item) => (
          <div key={item.label} className="flow-meta-card">
            <div className="muted small">{item.label}</div>
            <div className="metric-box-value">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
