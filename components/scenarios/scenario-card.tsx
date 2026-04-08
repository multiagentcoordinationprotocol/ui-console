import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PolicyBadge } from '@/components/ui/policy-badge';
import type { ScenarioSummary } from '@/lib/types';

export function ScenarioCard({ packSlug, scenario }: { packSlug: string; scenario: ScenarioSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{scenario.name}</CardTitle>
        <CardDescription>{scenario.summary}</CardDescription>
      </CardHeader>
      <CardContent className="stack">
        <div className="inline-list">
          {scenario.policyHints?.type && <PolicyBadge type={scenario.policyHints.type} />}
          {scenario.tags?.map((tag) => (
            <Badge key={tag} label={tag} />
          ))}
        </div>
        <div className="metric-strip">
          <div className="metric-box">
            <div className="muted small">Versions</div>
            <div className="metric-box-value">{scenario.versions.join(', ')}</div>
          </div>
          <div className="metric-box">
            <div className="muted small">Templates</div>
            <div className="metric-box-value">{scenario.templates.length}</div>
          </div>
          <div className="metric-box">
            <div className="muted small">Agents</div>
            <div className="metric-box-value">{scenario.agentRefs?.length ?? 0}</div>
          </div>
        </div>
        <div className="section-actions">
          <Link href={`/scenarios/${packSlug}/${scenario.scenario}`} className="button button-secondary">
            Inspect
          </Link>
          <Link href={`/runs/new?pack=${packSlug}&scenario=${scenario.scenario}`} className="button button-primary">
            Run scenario
            <ArrowRight size={16} />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
