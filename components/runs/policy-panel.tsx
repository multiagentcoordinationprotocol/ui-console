'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PolicyBadge } from '@/components/ui/policy-badge';
import type { PolicyProjection } from '@/lib/types';
import { formatDateTime } from '@/lib/utils/format';

export function PolicyPanel({ policy }: { policy: PolicyProjection }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy governance</CardTitle>
        <CardDescription>
          RFC-MACP-0012 policy evaluation status, commitment decisions, and governance constraints for this run.
        </CardDescription>
      </CardHeader>
      <CardContent className="stack">
        <div className="inline-list">
          {policy.policyVersion && <Badge label={policy.policyVersion} tone="info" />}
          {policy.resolvedAt ? <Badge label="resolved" tone="success" /> : <Badge label="pending" tone="warning" />}
        </div>

        {policy.policyDescription && <p className="muted">{policy.policyDescription}</p>}

        {policy.resolvedAt && (
          <div className="list-item">
            <div className="list-item-title">Resolved at</div>
            <div className="list-item-meta">{formatDateTime(policy.resolvedAt)}</div>
          </div>
        )}

        {policy.commitmentEvaluations.length > 0 && (
          <div className="stack">
            <h4 className="small muted">Commitment evaluations</h4>
            <table className="table">
              <thead>
                <tr>
                  <th>Commitment</th>
                  <th>Decision</th>
                  <th>Reasons</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {policy.commitmentEvaluations.map((evaluation) => (
                  <tr key={evaluation.commitmentId}>
                    <td>
                      <code>{evaluation.commitmentId}</code>
                    </td>
                    <td>
                      <PolicyBadge type={evaluation.decision === 'allow' ? 'none' : 'unanimous'} />
                      <Badge
                        label={evaluation.decision}
                        tone={evaluation.decision === 'allow' ? 'success' : 'danger'}
                      />
                    </td>
                    <td>{evaluation.reasons.join('; ')}</td>
                    <td className="muted small">{formatDateTime(evaluation.ts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {policy.commitmentEvaluations.length === 0 && (
          <div className="empty-state compact">
            <h4>No commitment evaluations yet</h4>
            <p>Policy evaluations will appear here as the runtime processes commitments.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
