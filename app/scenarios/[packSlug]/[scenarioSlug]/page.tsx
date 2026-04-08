'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { JsonViewer } from '@/components/ui/json-viewer';
import { PolicyBadge } from '@/components/ui/policy-badge';
import { PolicyRulesCard } from '@/components/ui/policy-rules-card';
import { Select } from '@/components/ui/field';
import { LoadingPanel, ErrorPanel } from '@/components/ui/state-panels';
import { getLaunchSchema, listScenarios } from '@/lib/api/client';
import { usePreferencesStore } from '@/lib/stores/preferences-store';

export default function ScenarioDetailPage() {
  return (
    <Suspense>
      <ScenarioDetailContent />
    </Suspense>
  );
}

function ScenarioDetailContent() {
  const params = useParams<{ packSlug: string; scenarioSlug: string }>();
  const searchParams = useSearchParams();
  const demoMode = usePreferencesStore((state) => state.demoMode);
  const [version, setVersion] = useState(searchParams.get('version') ?? '');
  const [template, setTemplate] = useState(searchParams.get('template') ?? '');

  const scenariosQuery = useQuery({
    queryKey: ['scenarios', params.packSlug, demoMode],
    queryFn: () => listScenarios(params.packSlug, demoMode)
  });

  const scenario = useMemo(
    () => scenariosQuery.data?.find((item) => item.scenario === params.scenarioSlug),
    [params.scenarioSlug, scenariosQuery.data]
  );

  /* eslint-disable react-hooks/set-state-in-effect -- initializing defaults from async scenario data */
  useEffect(() => {
    if (!scenario) return;
    if (!version) setVersion(scenario.versions[0] ?? '1.0.0');
    if (!template) setTemplate(scenario.templates[0] ?? 'default');
  }, [scenario, template, version]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const schemaQuery = useQuery({
    queryKey: ['launch-schema', params.packSlug, params.scenarioSlug, version, template, demoMode],
    queryFn: () => getLaunchSchema(params.packSlug, params.scenarioSlug, version, template, demoMode),
    enabled: Boolean(version)
  });

  if (scenariosQuery.isLoading || (version && schemaQuery.isLoading)) {
    return (
      <LoadingPanel
        title="Loading scenario detail"
        description="Inspecting launch schema, participants, templates, and runtime metadata."
      />
    );
  }

  if (scenariosQuery.error || !scenario) {
    return (
      <ErrorPanel
        message={String(scenariosQuery.error ?? 'Scenario was not found in this pack.')}
        actionHref="/scenarios"
        actionLabel="Back to catalog"
      />
    );
  }

  if (schemaQuery.error || !schemaQuery.data) {
    return (
      <ErrorPanel
        message={String(schemaQuery.error ?? 'Launch schema could not be loaded.')}
        actionHref="/scenarios"
        actionLabel="Back to catalog"
      />
    );
  }

  const schema = schemaQuery.data;

  return (
    <div className="stack">
      <div className="hero">
        <div>
          <h1>{scenario.name}</h1>
          <p>{scenario.summary}</p>
        </div>
        <div className="section-actions">
          <Link
            href={`/runs/new?pack=${params.packSlug}&scenario=${params.scenarioSlug}&version=${version}&template=${template}`}
            className="button button-primary"
          >
            <Play size={16} />
            Launch scenario
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scenario switches</CardTitle>
          <CardDescription>Swap between versions and templates before moving to run creation.</CardDescription>
        </CardHeader>
        <CardContent className="field-grid">
          <div>
            <label className="field-label">Version</label>
            <Select value={version} onChange={(event) => setVersion(event.target.value)}>
              {scenario.versions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="field-label">Template</label>
            <Select value={template} onChange={(event) => setTemplate(event.target.value)}>
              {scenario.templates.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="split-layout">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Scenario metadata, supported modes, and participating agents.</CardDescription>
          </CardHeader>
          <CardContent className="stack">
            <div className="inline-list">
              {schema.launchSummary.policyHints?.type && <PolicyBadge type={schema.launchSummary.policyHints.type} />}
              {(scenario.tags ?? []).map((tag) => (
                <Badge key={tag} label={tag} />
              ))}
              <Badge label={schema.runtime.kind} tone="info" />
              <Badge label={schema.launchSummary.modeName} tone="info" />
            </div>
            <div className="metric-strip">
              <div className="metric-box">
                <div className="muted small">Participants</div>
                <div className="metric-box-value">{schema.participants.length}</div>
              </div>
              <div className="metric-box">
                <div className="muted small">Templates</div>
                <div className="metric-box-value">{scenario.templates.length}</div>
              </div>
              <div className="metric-box">
                <div className="muted small">Decision kinds</div>
                <div className="metric-box-value">{schema.expectedDecisionKinds?.length ?? 0}</div>
              </div>
            </div>
            <div className="list">
              {schema.agents.map((agent) => (
                <div key={agent.agentRef} className="list-item">
                  <div className="list-item-title">{agent.name}</div>
                  <div className="list-item-meta">
                    {agent.role} · {agent.framework} · {agent.entrypoint}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="panel-stack">
          {schema.launchSummary.policyHints && (
            <PolicyRulesCard
              hints={schema.launchSummary.policyHints}
              policyVersion={schema.launchSummary.policyVersion}
            />
          )}
          <Card>
            <CardHeader>
              <CardTitle>Launch summary</CardTitle>
              <CardDescription>Compiled runtime session defaults derived from Example Service.</CardDescription>
            </CardHeader>
            <CardContent className="stack">
              <JsonViewer value={schema.launchSummary} />
              <div className="section-actions">
                <Link
                  href={`/runs/new?pack=${params.packSlug}&scenario=${params.scenarioSlug}&version=${version}&template=${template}`}
                  className="button button-secondary"
                >
                  Open launch page
                  <ArrowRight size={16} />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid-2">
        <Card>
          <CardHeader>
            <CardTitle>Input schema</CardTitle>
            <CardDescription>Editable input contract exposed by the launch schema endpoint.</CardDescription>
          </CardHeader>
          <CardContent>
            <JsonViewer value={schema.formSchema} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Default payload</CardTitle>
            <CardDescription>Default scenario inputs hydrated into the launch experience.</CardDescription>
          </CardHeader>
          <CardContent>
            <JsonViewer value={schema.defaults} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
