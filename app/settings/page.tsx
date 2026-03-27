'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Trash2, Webhook } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FieldLabel, Input, Select } from '@/components/ui/field';
import { JsonViewer } from '@/components/ui/json-viewer';
import { LoadingPanel, ErrorPanel } from '@/components/ui/state-panels';
import {
  createWebhook,
  deleteWebhook,
  getAuditLogs,
  getRuntimeHealth,
  getWebhooks,
  resetCircuitBreaker
} from '@/lib/api/client';
import { usePreferencesStore } from '@/lib/stores/preferences-store';
import { formatDateTime } from '@/lib/utils/format';

export default function SettingsPage() {
  const demoMode = usePreferencesStore((state) => state.demoMode);
  const setDemoMode = usePreferencesStore((state) => state.setDemoMode);
  const theme = usePreferencesStore((state) => state.theme);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  const autoFollow = usePreferencesStore((state) => state.autoFollow);
  const setAutoFollow = usePreferencesStore((state) => state.setAutoFollow);
  const showCriticalPath = usePreferencesStore((state) => state.showCriticalPath);
  const setShowCriticalPath = usePreferencesStore((state) => state.setShowCriticalPath);
  const showParallelBranches = usePreferencesStore((state) => state.showParallelBranches);
  const setShowParallelBranches = usePreferencesStore((state) => state.setShowParallelBranches);
  const replaySpeed = usePreferencesStore((state) => state.replaySpeed);
  const setReplaySpeed = usePreferencesStore((state) => state.setReplaySpeed);
  const logsDensity = usePreferencesStore((state) => state.logsDensity);
  const setLogsDensity = usePreferencesStore((state) => state.setLogsDensity);

  const [webhookUrl, setWebhookUrl] = useState('https://example.com/hooks/macp');
  const [webhookSecret, setWebhookSecret] = useState('change-me');
  const [webhookEvents, setWebhookEvents] = useState('run.completed,run.failed,signal.emitted');

  const queryClient = useQueryClient();
  const webhooksQuery = useQuery({ queryKey: ['settings-webhooks', demoMode], queryFn: () => getWebhooks(demoMode) });
  const auditQuery = useQuery({ queryKey: ['settings-audit', demoMode], queryFn: () => getAuditLogs(demoMode) });
  const healthQuery = useQuery({ queryKey: ['settings-health', demoMode], queryFn: () => getRuntimeHealth(demoMode) });

  const createWebhookMutation = useMutation({
    mutationFn: () =>
      createWebhook(
        {
          url: webhookUrl,
          secret: webhookSecret,
          events: webhookEvents
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        },
        demoMode
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings-webhooks'] });
    }
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: (id: string) => deleteWebhook(id, demoMode),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings-webhooks'] });
    }
  });

  const resetBreakerMutation = useMutation({ mutationFn: () => resetCircuitBreaker(demoMode) });

  const preferencePayload = useMemo(
    () => ({ theme, demoMode, autoFollow, showCriticalPath, showParallelBranches, replaySpeed, logsDensity }),
    [autoFollow, demoMode, logsDensity, replaySpeed, showCriticalPath, showParallelBranches, theme]
  );

  if (webhooksQuery.isLoading || auditQuery.isLoading || healthQuery.isLoading) {
    return (
      <LoadingPanel
        title="Loading settings"
        description="Reading preferences, webhook subscriptions, audit entries, and runtime status."
      />
    );
  }
  if (webhooksQuery.error || auditQuery.error || healthQuery.error || !healthQuery.data) {
    return (
      <ErrorPanel
        message={String(
          webhooksQuery.error ?? auditQuery.error ?? healthQuery.error ?? 'Settings data is unavailable.'
        )}
        actionHref="/"
      />
    );
  }

  return (
    <div className="stack">
      <div className="hero">
        <div>
          <h1>Settings and integrations</h1>
          <p>
            Adjust console behavior, manage webhook subscriptions, and trigger operational actions against the Control
            Plane.
          </p>
        </div>
      </div>

      <div className="split-layout">
        <Card>
          <CardHeader>
            <CardTitle>Console preferences</CardTitle>
            <CardDescription>Persisted in local storage for the current browser session.</CardDescription>
          </CardHeader>
          <CardContent className="stack">
            <div className="field-grid">
              <div>
                <FieldLabel>Theme</FieldLabel>
                <Select value={theme} onChange={(event) => setTheme(event.target.value as 'dark' | 'light')}>
                  <option value="dark">dark</option>
                  <option value="light">light</option>
                </Select>
              </div>
              <div>
                <FieldLabel>Replay speed</FieldLabel>
                <Select value={String(replaySpeed)} onChange={(event) => setReplaySpeed(Number(event.target.value))}>
                  <option value="0.5">0.5x</option>
                  <option value="1">1x</option>
                  <option value="2">2x</option>
                  <option value="4">4x</option>
                </Select>
              </div>
              <div>
                <FieldLabel>Log density</FieldLabel>
                <Select
                  value={logsDensity}
                  onChange={(event) => setLogsDensity(event.target.value as 'compact' | 'comfortable')}
                >
                  <option value="comfortable">comfortable</option>
                  <option value="compact">compact</option>
                </Select>
              </div>
              <div className="stack">
                <label className="switch-row">
                  <input type="checkbox" checked={demoMode} onChange={(event) => setDemoMode(event.target.checked)} />
                  <span>Demo mode</span>
                </label>
                <label className="switch-row">
                  <input
                    type="checkbox"
                    checked={autoFollow}
                    onChange={(event) => setAutoFollow(event.target.checked)}
                  />
                  <span>Auto-follow active node</span>
                </label>
                <label className="switch-row">
                  <input
                    type="checkbox"
                    checked={showCriticalPath}
                    onChange={(event) => setShowCriticalPath(event.target.checked)}
                  />
                  <span>Animate critical path</span>
                </label>
                <label className="switch-row">
                  <input
                    type="checkbox"
                    checked={showParallelBranches}
                    onChange={(event) => setShowParallelBranches(event.target.checked)}
                  />
                  <span>Show parallel branches</span>
                </label>
              </div>
            </div>
            <JsonViewer value={preferencePayload} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Runtime + integration status</CardTitle>
            <CardDescription>
              Current runtime health plus environment-aware notes for Example Service and Control Plane integration.
            </CardDescription>
          </CardHeader>
          <CardContent className="stack">
            <div className="inline-list">
              <Badge
                label={healthQuery.data.ok ? 'healthy' : 'degraded'}
                tone={healthQuery.data.ok ? 'success' : 'danger'}
              />
              <Badge label={healthQuery.data.runtimeKind} tone="info" />
              <Badge label={process.env.NEXT_PUBLIC_MACP_ENVIRONMENT_LABEL ?? 'local-dev'} />
            </div>
            <div className="list-item">
              <div className="list-item-title">Proxy routing</div>
              <div className="list-item-meta">
                Client traffic is routed through <code>/api/proxy/[service]/...</code> to avoid leaking secrets to the
                browser.
              </div>
            </div>
            <div className="list-item">
              <div className="list-item-title">Expected secrets</div>
              <div className="list-item-meta">
                Set EXAMPLE_SERVICE_BASE_URL / EXAMPLE_SERVICE_API_KEY and CONTROL_PLANE_BASE_URL /
                CONTROL_PLANE_API_KEY in <code>.env.local</code>.
              </div>
            </div>
            <JsonViewer value={healthQuery.data} />
          </CardContent>
        </Card>
      </div>

      <div className="split-layout">
        <Card>
          <CardHeader>
            <CardTitle style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Webhook size={18} /> Webhooks
            </CardTitle>
            <CardDescription>Manage subscriptions to run lifecycle events and emitted signals.</CardDescription>
          </CardHeader>
          <CardContent className="stack">
            <div className="field-grid">
              <div>
                <FieldLabel>Webhook URL</FieldLabel>
                <Input value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} />
              </div>
              <div>
                <FieldLabel>Secret</FieldLabel>
                <Input value={webhookSecret} onChange={(event) => setWebhookSecret(event.target.value)} />
              </div>
            </div>
            <div>
              <FieldLabel>Events</FieldLabel>
              <Input value={webhookEvents} onChange={(event) => setWebhookEvents(event.target.value)} />
            </div>
            <div className="section-actions">
              <Button
                variant="secondary"
                onClick={() => createWebhookMutation.mutate()}
                disabled={createWebhookMutation.isPending}
              >
                Create webhook
              </Button>
              <Button
                variant="ghost"
                onClick={() => resetBreakerMutation.mutate()}
                disabled={resetBreakerMutation.isPending}
              >
                <RotateCcw size={16} />
                Reset circuit breaker
              </Button>
            </div>
            <div className="list">
              {(webhooksQuery.data ?? []).map((webhook) => (
                <div
                  key={webhook.id}
                  className="list-item"
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}
                >
                  <div>
                    <div className="list-item-title">{webhook.url}</div>
                    <div className="list-item-meta">
                      {webhook.events.join(', ')} · created {formatDateTime(webhook.createdAt)}
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                    disabled={deleteWebhookMutation.isPending}
                  >
                    <Trash2 size={16} />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            {resetBreakerMutation.data ? <JsonViewer value={resetBreakerMutation.data} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit trail</CardTitle>
            <CardDescription>Recent administrative actions routed through the control plane.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="timeline-list">
              {(auditQuery.data?.data ?? []).slice(0, 10).map((entry, index) => (
                <div key={`${entry.action}-${index}`} className="timeline-item">
                  <div className="list-item-title">{entry.action}</div>
                  <div className="list-item-meta">
                    {entry.actor} · {entry.actorType} · {formatDateTime(entry.createdAt)}
                  </div>
                  <div className="muted small">
                    {entry.resource}
                    {entry.resourceId ? ` / ${entry.resourceId}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
