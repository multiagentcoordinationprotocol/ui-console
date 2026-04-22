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
import '@xyflow/react/dist/style.css';
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
  outcomePositive?: boolean;
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
    <div
      className={`flow-node-card ${data.selected ? 'flow-node-card-selected' : ''}`}
      style={
        data.kind === 'decision' && data.outcomePositive !== undefined
          ? {
              borderLeftWidth: 3,
              borderLeftStyle: 'solid',
              borderLeftColor: data.outcomePositive ? 'var(--success)' : 'var(--danger)'
            }
          : undefined
      }
    >
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

/** Column order for auto-layout based on node kind. */
const kindColumnOrder: Record<string, number> = {
  start: 0,
  context: 1,
  agent: 2,
  decision: 3,
  output: 4
};

const COLUMN_WIDTH = 280;
const ROW_HEIGHT = 160;
const BASE_X = 40;
const BASE_Y = 80;

function buildNodePositions(state: RunStateProjection) {
  // Group nodes by their layout column based on kind
  const columns = new Map<number, string[]>();
  for (const node of state.graph.nodes) {
    const col = kindColumnOrder[node.kind] ?? 2; // default agents to col 2
    const list = columns.get(col) ?? [];
    list.push(node.id);
    columns.set(col, list);
  }

  const positionMap = new Map<string, { x: number; y: number }>();
  for (const [col, nodeIds] of columns) {
    const totalHeight = (nodeIds.length - 1) * ROW_HEIGHT;
    const startY = BASE_Y + Math.max(0, (2 * ROW_HEIGHT - totalHeight) / 2);
    for (let i = 0; i < nodeIds.length; i++) {
      positionMap.set(nodeIds[i], { x: BASE_X + col * COLUMN_WIDTH, y: startY + i * ROW_HEIGHT });
    }
  }

  return state.graph.nodes.map((node) => ({
    id: node.id,
    position: positionMap.get(node.id) ?? { x: BASE_X, y: BASE_Y }
  }));
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
      const latestProgress = [...state.progress.entries].reverse().find((entry) => entry.participantId === node.id);
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
          ].filter(Boolean),
          outcomePositive:
            node.kind === 'decision'
              ? // `null` (BE-3: decision resolved without outcome semantics) renders like
                // "no outcome flag" — map to undefined so the accent border is muted.
                (state.decision.current?.outcomePositive ?? undefined) === null
                ? undefined
                : (state.decision.current?.outcomePositive ?? undefined)
              : undefined
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

  // Q2 — keep only Participants (graph-specific context). Signals / Events /
  // Messages live in RunOverviewCard's KPI strip (Q1 routes them by run.status)
  // and as per-node badges on the graph itself.
  const summaryCards = [{ label: 'Participants', value: String(state.participants.length) }];

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
