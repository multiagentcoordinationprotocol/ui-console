import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AgentProfile } from '@/lib/types';

export function AgentCard({ agent }: { agent: AgentProfile }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{agent.name}</CardTitle>
        <CardDescription>{agent.description}</CardDescription>
      </CardHeader>
      <CardContent className="stack">
        <div className="inline-list">
          <Badge label={agent.role} tone="info" />
          <Badge label={agent.framework} />
          {(agent.tags ?? []).slice(0, 3).map((tag) => (
            <Badge key={tag} label={tag} />
          ))}
        </div>
        {agent.metrics && (
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
                {agent.metrics.averageLatencyMs != null ? `${agent.metrics.averageLatencyMs}ms` : '—'}
              </div>
            </div>
          </div>
        )}
        {agent.scenarios.length > 0 && (
          <div className="inline-list">
            {agent.scenarios.slice(0, 3).map((s) => (
              <Link key={s} href={`/scenarios?search=${encodeURIComponent(s.split('@')[0])}`}>
                <Badge label={s.split('/').pop()?.split('@')[0] ?? s} tone="neutral" />
              </Link>
            ))}
            {agent.scenarios.length > 3 && <Badge label={`+${agent.scenarios.length - 3} more`} tone="neutral" />}
          </div>
        )}
        <Link href={`/agents/${agent.agentRef}`} className="button button-secondary">
          Open agent
        </Link>
      </CardContent>
    </Card>
  );
}
