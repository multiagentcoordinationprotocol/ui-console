import type { JaegerSpan, JaegerTrace } from '@/lib/api/client';

/**
 * PR-D4 — build a tree of spans from their parent/child `references`.
 *
 * Jaeger spans carry `references[]` with `refType: 'CHILD_OF'` pointing
 * at their parent. The flat-time waterfall (today's `/traces` page)
 * ignores this structure; the tree-indented waterfall uses it.
 *
 * Output is a depth-annotated list in tree order (parents first), with
 * root spans at depth 0. Orphans (spans whose parent isn't in the
 * trace) are treated as additional roots — same behaviour as Jaeger's
 * own UI.
 */

export interface SpanTreeNode {
  span: JaegerSpan;
  depth: number;
  /** Number of direct descendants (not just children). Useful for collapse. */
  descendantCount: number;
  parentId: string | null;
  childIds: string[];
}

export function buildSpanTree(trace: JaegerTrace): SpanTreeNode[] {
  const spansById = new Map<string, JaegerSpan>();
  for (const span of trace.spans) spansById.set(span.spanID, span);

  // Index children by parent id.
  const childrenByParent = new Map<string | null, string[]>();
  for (const span of trace.spans) {
    const parentId = findParentId(span, spansById);
    const list = childrenByParent.get(parentId) ?? [];
    list.push(span.spanID);
    childrenByParent.set(parentId, list);
  }

  // Stable ordering: within siblings, sort by startTime ascending.
  for (const [parent, children] of childrenByParent) {
    children.sort((a, b) => (spansById.get(a)?.startTime ?? 0) - (spansById.get(b)?.startTime ?? 0));
    childrenByParent.set(parent, children);
  }

  const nodes: SpanTreeNode[] = [];
  const walk = (id: string, depth: number, parentId: string | null) => {
    const span = spansById.get(id);
    if (!span) return 0;
    const children = childrenByParent.get(id) ?? [];
    const node: SpanTreeNode = {
      span,
      depth,
      descendantCount: 0,
      parentId,
      childIds: children
    };
    nodes.push(node);
    const nodeIdx = nodes.length - 1;
    let descendants = 0;
    for (const childId of children) {
      descendants += 1 + walk(childId, depth + 1, id);
    }
    nodes[nodeIdx].descendantCount = descendants;
    return descendants;
  };

  const roots = childrenByParent.get(null) ?? [];
  for (const rootId of roots) walk(rootId, 0, null);

  return nodes;
}

function findParentId(span: JaegerSpan, spans: Map<string, JaegerSpan>): string | null {
  if (!span.references) return null;
  for (const ref of span.references) {
    if (ref.refType === 'CHILD_OF' && ref.spanID && spans.has(ref.spanID) && ref.spanID !== span.spanID) {
      return ref.spanID;
    }
  }
  return null;
}

/**
 * Find the critical path: the longest root-to-leaf chain by
 * cumulative span duration. Returned as a Set of span IDs for O(1)
 * lookup during rendering.
 */
export function findCriticalPath(tree: SpanTreeNode[]): Set<string> {
  if (tree.length === 0) return new Set();
  const byId = new Map<string, SpanTreeNode>();
  for (const node of tree) byId.set(node.span.spanID, node);

  const durationThroughNode = new Map<string, number>();
  const bestChildOf = new Map<string, string | null>();

  // Post-order DP: walk in reverse of tree order (children come after
  // parents in our output, so reversing visits leaves first).
  for (let i = tree.length - 1; i >= 0; i--) {
    const node = tree[i];
    if (node.childIds.length === 0) {
      durationThroughNode.set(node.span.spanID, node.span.duration);
      bestChildOf.set(node.span.spanID, null);
      continue;
    }
    let bestChild: string | null = null;
    let bestDuration = 0;
    for (const cid of node.childIds) {
      const d = durationThroughNode.get(cid) ?? 0;
      if (d > bestDuration) {
        bestDuration = d;
        bestChild = cid;
      }
    }
    durationThroughNode.set(node.span.spanID, node.span.duration + bestDuration);
    bestChildOf.set(node.span.spanID, bestChild);
  }

  // Pick the root with the longest chain.
  const roots = tree.filter((n) => n.depth === 0);
  let chosenRoot: SpanTreeNode | null = null;
  let chosenDuration = -1;
  for (const r of roots) {
    const d = durationThroughNode.get(r.span.spanID) ?? 0;
    if (d > chosenDuration) {
      chosenDuration = d;
      chosenRoot = r;
    }
  }
  if (!chosenRoot) return new Set();

  const critical = new Set<string>();
  let current: string | null = chosenRoot.span.spanID;
  while (current) {
    critical.add(current);
    current = bestChildOf.get(current) ?? null;
  }
  return critical;
}
