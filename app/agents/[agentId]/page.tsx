'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { JsonViewer } from '@/components/ui/json-viewer';
import { RunsTable } from '@/components/runs/runs-table';
import { LoadingPanel, ErrorPanel } from '@/components/ui/state-panels';
import { getAgentProfile, listRuns } from '@/lib/api/client';
import { usePreferencesStore } from '@/lib/stores/preferences-store';

export default function AgentDetailPage() {
  const params = useParams<{ agentId: string }>();
  const demoMode = usePreferencesStore((state) => state.demoMode);
  const agentQuery = useQuery({
    queryKey: ['agent-profile', params.agentId, demoMode],
    queryFn: () => getAgentProfile(params.agentId, demoMode)
  });
  const runsQuery = useQuery({ queryKey: ['agent-runs', demoMode], queryFn: () => listRuns(demoMode) });

  const relatedRuns = useMemo(() => {
    const scenarios = agentQuery.data?.scenarios ?? [];
    return (runsQuery.data ?? []).filter((run) =>
      scenarios.includes(String(run.metadata?.scenarioRef ?? run.source?.ref ?? ''))
    );
  }, [agentQuery.data?.scenarios, runsQuery.data]);

  if (agentQuery.isLoading || runsQuery.isLoading)
    return (
      <LoadingPanel
        title="Loading agent detail"
        description="Fetching agent profile, scenario coverage, and related run activity."
      />
    );
  if (agentQuery.error || !agentQuery.data)
    return (
      <ErrorPanel
        message={String(agentQuery.error ?? 'Agent profile was not found.')}
        actionHref="/agents"
        actionLabel="Back to agents"
      />
    );

  const agent = agentQuery.data;

  return (
    <div className="stack">
      <div className="hero">
        <div>
          <h1>{agent.name}</h1>
          <p>{agent.description}</p>
        </div>
        <div className="section-actions">
          {agent.scenarios[0] ? (
            <Link
              href={`/runs/new?pack=${agent.scenarios[0].split('/')[0]}&scenario=${agent.scenarios[0].split('/')[1]?.split('@')[0]}`}
              className="button button-primary"
            >
              Launch related scenario
            </Link>
          ) : null}
        </div>
      </div>

      <div className="split-layout">
        <Card>
          <CardHeader>
            <CardTitle>Agent metadata</CardTitle>
            <CardDescription>
              Framework, transport identity, bootstrap settings, and scenario participation.
            </CardDescription>
          </CardHeader>
          <CardContent className="stack">
            <div className="inline-list">
              <Badge label={agent.role} tone="info" />
              <Badge label={agent.framework} />
              {(agent.tags ?? []).map((tag) => (
                <Badge key={tag} label={tag} />
              ))}
            </div>
            <div className="metric-strip">
              <div className="metric-box">
                <div className="muted small">Runs</div>
                <div className="metric-box-value">{agent.metrics.runs}</div>
              </div>
              <div className="metric-box">
                <div className="muted small">Signals</div>
                <div className="metric-box-value">{agent.metrics.signals}</div>
              </div>
              <div className="metric-box">
                <div className="muted small">Avg latency</div>
                <div className="metric-box-value">
                  {agent.metrics.averageLatencyMs != null ? `${agent.metrics.averageLatencyMs}ms` : 'N/A'}
                </div>
              </div>
            </div>
            <JsonViewer value={agent} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scenario coverage</CardTitle>
            <CardDescription>
              Where this agent appears in the catalog and how it participates in execution orchestration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="list">
              {agent.scenarios.map((scenario) => (
                <div key={scenario} className="list-item">
                  <div className="list-item-title">{scenario}</div>
                  <div className="list-item-meta">Transport identity: {agent.transportIdentity ?? 'n/a'}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Related runs</CardTitle>
          <CardDescription>Historical run samples from scenarios that include this agent.</CardDescription>
        </CardHeader>
        <CardContent>
          <RunsTable runs={relatedRuns} showCompare={false} />
        </CardContent>
      </Card>
    </div>
  );
}
