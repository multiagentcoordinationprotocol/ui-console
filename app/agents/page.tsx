'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bot } from 'lucide-react';
import { AgentCard } from '@/components/agents/agent-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/field';
import { LoadingPanel, ErrorPanel } from '@/components/ui/state-panels';
import { getAgentMetrics, getAgentProfiles } from '@/lib/api/client';
import { usePreferencesStore } from '@/lib/stores/preferences-store';

export default function AgentsPage() {
  const demoMode = usePreferencesStore((state) => state.demoMode);
  const [search, setSearch] = useState('');
  const [framework, setFramework] = useState('all');
  const agentsQuery = useQuery({ queryKey: ['agent-profiles', demoMode], queryFn: () => getAgentProfiles(demoMode) });
  const metricsQuery = useQuery({
    queryKey: ['agent-metrics', demoMode],
    queryFn: () => getAgentMetrics(demoMode)
  });

  const enrichedAgents = useMemo(() => {
    const agents = agentsQuery.data ?? [];
    const metricsMap = new Map((metricsQuery.data ?? []).map((m) => [m.agentRef, m]));
    if (metricsMap.size === 0) return agents;
    return agents.map((agent) => {
      const m = metricsMap.get(agent.agentRef);
      if (!m) return agent;
      return {
        ...agent,
        metrics: {
          runs: m.runs,
          signals: m.signals,
          averageLatencyMs: m.averageLatencyMs,
          averageConfidence: m.averageConfidence
        }
      };
    });
  }, [agentsQuery.data, metricsQuery.data]);

  const frameworks = useMemo(() => {
    return ['all', ...new Set(enrichedAgents.map((agent) => agent.framework))];
  }, [enrichedAgents]);

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return enrichedAgents.filter((agent) => {
      const matchesFramework = framework === 'all' || agent.framework === framework;
      const haystack = [
        agent.name,
        agent.role,
        agent.framework,
        agent.description,
        ...(agent.tags ?? []),
        ...agent.scenarios
      ]
        .join(' ')
        .toLowerCase();
      return matchesFramework && haystack.includes(lower);
    });
  }, [enrichedAgents, framework, search]);

  if (agentsQuery.isLoading)
    return (
      <LoadingPanel
        title="Loading agents"
        description="Cataloging transport identities, entrypoints, frameworks, and scenario coverage."
      />
    );
  if (agentsQuery.error || !agentsQuery.data)
    return <ErrorPanel message={String(agentsQuery.error ?? 'Agent catalog is unavailable.')} actionHref="/" />;

  return (
    <div className="stack">
      <div className="hero">
        <div>
          <h1>Agent catalog</h1>
          <p>
            Inspect agent roles, frameworks, transport identities, and which scenarios each specialist participates in.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter agents</CardTitle>
          <CardDescription>Search by role, framework, tag, scenario coverage, or transport identity.</CardDescription>
        </CardHeader>
        <CardContent className="field-grid">
          <div>
            <label className="field-label">Search</label>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="fraud, risk, langgraph, onboarding..."
            />
          </div>
          <div>
            <label className="field-label">Framework</label>
            <Select value={framework} onChange={(event) => setFramework(event.target.value)}>
              {frameworks.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="section-header">
        <div>
          <h2 className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <Bot size={18} />
            {filtered.length} agents
          </h2>
          <p className="section-description">Designed for node-centric debugging and scenario-level transparency.</p>
        </div>
      </div>
      <div className="grid-2">
        {filtered.map((agent) => (
          <AgentCard key={agent.agentRef} agent={agent} />
        ))}
      </div>
    </div>
  );
}
