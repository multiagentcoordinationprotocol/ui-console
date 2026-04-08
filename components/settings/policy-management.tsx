'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FieldLabel, Input, Select, Textarea } from '@/components/ui/field';
import { JsonViewer } from '@/components/ui/json-viewer';
import { PolicyBadge } from '@/components/ui/policy-badge';
import { listRuntimePolicies, registerRuntimePolicy, unregisterRuntimePolicy } from '@/lib/api/client';
import { formatDateTime } from '@/lib/utils/format';

interface PolicyManagementProps {
  demoMode: boolean;
}

export function PolicyManagement({ demoMode }: PolicyManagementProps) {
  const queryClient = useQueryClient();
  const [modeFilter, setModeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const policiesQuery = useQuery({
    queryKey: ['runtime-policies', demoMode, modeFilter],
    queryFn: () => listRuntimePolicies(demoMode, modeFilter || undefined)
  });

  const deleteMutation = useMutation({
    mutationFn: (policyId: string) => unregisterRuntimePolicy(policyId, demoMode),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['runtime-policies'] });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} /> Runtime policies
        </CardTitle>
        <CardDescription>Manage governance policies registered with the control plane runtime.</CardDescription>
      </CardHeader>
      <CardContent className="stack">
        <div className="form-row" style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div>
            <FieldLabel>Filter by mode</FieldLabel>
            <Input
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              placeholder="e.g. macp.mode.decision.v1"
            />
          </div>
          <Button variant="secondary" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} />
            {showForm ? 'Cancel' : 'Register policy'}
          </Button>
        </div>

        {showForm && <RegisterPolicyForm demoMode={demoMode} onSuccess={() => setShowForm(false)} />}

        <div className="list">
          {(policiesQuery.data ?? []).map((policy) => (
            <div
              key={policy.policyId}
              className="list-item"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div
                style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === policy.policyId ? null : policy.policyId)}
              >
                <div className="list-item-title">
                  {policy.policyId}
                  <PolicyBadge type={policy.mode.includes('decision') ? 'majority' : 'none'} />
                </div>
                <div className="list-item-meta">
                  {policy.description} · v{policy.schemaVersion}
                  {policy.registeredAtUnixMs
                    ? ` · registered ${formatDateTime(new Date(policy.registeredAtUnixMs).toISOString())}`
                    : ''}
                </div>
                {expandedId === policy.policyId && (
                  <div style={{ marginTop: 8 }}>
                    <JsonViewer value={policy.rules} />
                  </div>
                )}
              </div>
              <div className="section-actions">
                <Button
                  variant="danger"
                  onClick={() => {
                    if (policy.policyId === 'policy.default') return;
                    deleteMutation.mutate(policy.policyId);
                  }}
                  disabled={deleteMutation.isPending || policy.policyId === 'policy.default'}
                >
                  <Trash2 size={14} />
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {policiesQuery.data?.length === 0 && (
            <div className="empty-state compact">
              <h4>No runtime policies registered</h4>
              <p>Register a policy to enforce governance constraints on runs.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RegisterPolicyForm({ demoMode, onSuccess }: { demoMode: boolean; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const [policyId, setPolicyId] = useState('');
  const [mode, setMode] = useState('macp.mode.decision.v1');
  const [description, setDescription] = useState('');
  const [schemaVersion, setSchemaVersion] = useState('1');
  const [rulesJson, setRulesJson] = useState('{}');
  const [validationError, setValidationError] = useState('');

  const registerMutation = useMutation({
    mutationFn: () => {
      let rules: Record<string, unknown>;
      try {
        rules = JSON.parse(rulesJson);
      } catch {
        throw new Error('Invalid JSON in rules field');
      }
      return registerRuntimePolicy(
        {
          policyId,
          mode,
          description,
          rules,
          schemaVersion: Number(schemaVersion)
        },
        demoMode
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['runtime-policies'] });
      setPolicyId('');
      setDescription('');
      setRulesJson('{}');
      onSuccess();
    }
  });

  function validate(): string {
    if (!policyId.trim()) return 'Policy ID is required';
    if (policyId === 'policy.default') return 'Reserved policy ID: policy.default';
    if (!description.trim()) return 'Description is required';
    const sv = Number(schemaVersion);
    if (!Number.isInteger(sv) || sv <= 0) return 'Schema version must be a positive integer';
    try {
      JSON.parse(rulesJson);
    } catch {
      return 'Rules must be valid JSON';
    }
    return '';
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError('');
    registerMutation.mutate();
  }

  return (
    <form
      className="stack"
      onSubmit={handleSubmit}
      style={{ padding: '12px 0', borderTop: '1px solid var(--color-border)' }}
    >
      <div className="grid-2">
        <div>
          <FieldLabel>Policy ID</FieldLabel>
          <Input value={policyId} onChange={(e) => setPolicyId(e.target.value)} placeholder="policy.my-custom" />
        </div>
        <div>
          <FieldLabel>Target mode</FieldLabel>
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="macp.mode.decision.v1">macp.mode.decision.v1</option>
            <option value="macp.mode.quorum.v1">macp.mode.quorum.v1</option>
          </Select>
        </div>
      </div>
      <div className="grid-2">
        <div>
          <FieldLabel>Description</FieldLabel>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the policy..."
          />
        </div>
        <div>
          <FieldLabel>Schema version</FieldLabel>
          <Input type="number" value={schemaVersion} onChange={(e) => setSchemaVersion(e.target.value)} min="1" />
        </div>
      </div>
      <div>
        <FieldLabel>Rules (JSON)</FieldLabel>
        <Textarea value={rulesJson} onChange={(e) => setRulesJson(e.target.value)} rows={4} />
      </div>
      {validationError && <div className="error-text">{validationError}</div>}
      {registerMutation.isError && (
        <div className="error-text">
          Registration failed.{registerMutation.error instanceof Error ? ` ${registerMutation.error.message}` : ''}
        </div>
      )}
      <Button type="submit" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? 'Registering...' : 'Register policy'}
      </Button>
    </form>
  );
}
