'use client';

import { useCallback, useMemo, useState, type KeyboardEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/field';
import { JsonViewer } from '@/components/ui/json-viewer';
import { LoadingPanel, ErrorPanel } from '@/components/ui/state-panels';
import { getLogsData, listRuns } from '@/lib/api/client';
import { usePreferencesStore } from '@/lib/stores/preferences-store';
import { formatDateTime, truncate } from '@/lib/utils/format';

const EVENT_TYPE_GROUPS: Record<string, string[]> = {
  Run: ['run.created', 'run.started', 'run.completed', 'run.failed', 'run.cancelled'],
  Session: ['session.opened', 'session.resolved', 'session.expired'],
  Participant: ['participant.joined', 'participant.left', 'participant.progress'],
  Message: ['message.sent', 'message.received', 'message.send_failed'],
  Signal: ['signal.emitted', 'signal.acknowledged'],
  Proposal: ['proposal.submitted', 'proposal.accepted', 'proposal.rejected'],
  Decision: ['decision.proposed', 'decision.finalized'],
  Policy: ['policy.resolved', 'policy.commitment.evaluated', 'policy.denied'],
  Tool: ['tool.call.started', 'tool.call.completed']
};

export default function LogsPage() {
  const demoMode = usePreferencesStore((state) => state.demoMode);
  const [runId, setRunId] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const toggleExpand = useCallback((id: string) => setExpandedEventId((prev) => (prev === id ? null : id)), []);
  const handleRowKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTableRowElement>, id: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleExpand(id);
      }
    },
    [toggleExpand]
  );
  const runsQuery = useQuery({ queryKey: ['log-runs', demoMode], queryFn: () => listRuns(demoMode) });
  const effectiveRunId = runId || runsQuery.data?.[0]?.id || '';

  const logsQuery = useQuery({
    queryKey: ['logs-data', effectiveRunId, demoMode],
    queryFn: () => getLogsData(demoMode, effectiveRunId || undefined),
    enabled: demoMode || Boolean(effectiveRunId)
  });

  const eventTypes = useMemo(() => {
    const dynamicTypes = new Set((logsQuery.data ?? []).map((event) => event.type));
    const staticTypes = Object.values(EVENT_TYPE_GROUPS).flat();
    const allTypes = new Set([...staticTypes, ...dynamicTypes]);
    return ['all', ...allTypes];
  }, [logsQuery.data]);

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return (logsQuery.data ?? []).filter((event) => {
      const matchesType = typeFilter === 'all' || event.type === typeFilter;
      const haystack = [event.type, event.subject?.id, event.subject?.kind, JSON.stringify(event.data)]
        .join(' ')
        .toLowerCase();
      return matchesType && haystack.includes(lower);
    });
  }, [logsQuery.data, search, typeFilter]);

  if (runsQuery.isLoading || logsQuery.isLoading)
    return (
      <LoadingPanel
        title="Loading logs"
        description="Fetching canonical events and log-like runtime activity for the selected run."
      />
    );
  if (runsQuery.error || logsQuery.error)
    return (
      <ErrorPanel
        message={String(runsQuery.error ?? logsQuery.error ?? 'Unable to load logs.')}
        actionHref="/runs"
        actionLabel="Open runs"
      />
    );

  return (
    <div className="stack">
      <div className="hero">
        <div>
          <h1>Logs and canonical events</h1>
          <p>
            Browse canonical event traffic emitted by the Control Plane, filter by type, and correlate with participant
            activity.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Select a run, narrow by event type, and search event payloads.</CardDescription>
        </CardHeader>
        <CardContent className="grid-3">
          <div>
            <label className="field-label">Run</label>
            <Select value={effectiveRunId} onChange={(event) => setRunId(event.target.value)}>
              {(runsQuery.data ?? []).map((run) => (
                <option key={run.id} value={run.id}>
                  {String(run.metadata?.scenarioRef ?? run.source?.ref ?? run.id)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="field-label">Event type</label>
            <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="all">all</option>
              {Object.entries(EVENT_TYPE_GROUPS).map(([group, types]) => (
                <optgroup key={group} label={group}>
                  {types.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </optgroup>
              ))}
              {eventTypes
                .filter((t) => t !== 'all' && !Object.values(EVENT_TYPE_GROUPS).flat().includes(t))
                .map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
            </Select>
          </div>
          <div>
            <label className="field-label">Search</label>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="participant, proposal, decision, signal..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid-3">
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-label">Events</div>
            <div className="kpi-value">{filtered.length}</div>
            <div className="kpi-meta">After current filters</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-label">Distinct types</div>
            <div className="kpi-value">{eventTypes.length - 1}</div>
            <div className="kpi-meta">Observed in this log slice</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="kpi-card">
            <div className="kpi-label">Selected run</div>
            <div className="kpi-value" style={{ fontSize: '1rem' }}>
              {effectiveRunId.slice(0, 8)}
            </div>
            <div className="kpi-meta">Canonical event explorer</div>
          </CardContent>
        </Card>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 28 }}></th>
              <th>Seq</th>
              <th>Timestamp</th>
              <th>Type</th>
              <th>Subject</th>
              <th>Source</th>
              <th>Payload</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((event) => {
              const isExpanded = expandedEventId === event.id;
              return (
                <tr
                  key={event.id}
                  className="expandable-row"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-label={`Event ${event.seq}: ${event.type}. Press Enter to ${isExpanded ? 'collapse' : 'expand'} payload.`}
                  onClick={() => toggleExpand(event.id)}
                  onKeyDown={(e) => handleRowKeyDown(e, event.id)}
                >
                  <td style={{ color: 'var(--muted)' }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </td>
                  <td>
                    <Badge label={String(event.seq)} />
                  </td>
                  <td>{formatDateTime(event.ts)}</td>
                  <td>{event.type}</td>
                  <td>{event.subject ? `${event.subject.kind}:${event.subject.id}` : '—'}</td>
                  <td>{event.source.name}</td>
                  <td>{isExpanded ? <JsonViewer value={event.data} /> : truncate(JSON.stringify(event.data), 180)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
