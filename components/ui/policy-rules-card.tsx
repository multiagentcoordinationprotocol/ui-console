'use client';

import { Badge } from '@/components/ui/badge';
import { PolicyBadge } from '@/components/ui/policy-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PolicyHints } from '@/lib/types';
import { formatPercent } from '@/lib/utils/format';

interface PolicyRulesCardProps {
  hints: PolicyHints;
  policyVersion?: string;
  compact?: boolean;
}

export function PolicyRulesCard({ hints, policyVersion, compact }: PolicyRulesCardProps) {
  const Wrapper = compact ? CompactWrapper : FullWrapper;

  return (
    <Wrapper policyVersion={policyVersion}>
      <div className="metric-strip">
        <div className="metric-box">
          <div className="muted small">Voting algorithm</div>
          <div className="metric-box-value">
            <PolicyBadge type={hints.type} />
          </div>
        </div>
        {hints.threshold !== undefined && (
          <div className="metric-box">
            <div className="muted small">Threshold</div>
            <div className="metric-box-value">{formatPercent(hints.threshold)}</div>
          </div>
        )}
        {hints.minimumConfidence !== undefined && hints.minimumConfidence > 0 && (
          <div className="metric-box">
            <div className="muted small">Min confidence</div>
            <div className="metric-box-value">{formatPercent(hints.minimumConfidence)}</div>
          </div>
        )}
        {hints.vetoThreshold !== undefined && (
          <div className="metric-box">
            <div className="muted small">Veto threshold</div>
            <div className="metric-box-value">{hints.vetoThreshold}</div>
          </div>
        )}
      </div>

      <div className="inline-list">
        {hints.vetoEnabled || hints.criticalSeverityVetoes ? (
          <Badge label="Veto enabled" tone="warning" />
        ) : (
          <Badge label="No veto" tone="neutral" />
        )}
        {hints.criticalSeverityVetoes && <Badge label="Critical severity vetoes" tone="danger" />}
      </div>

      {hints.vetoRoles && hints.vetoRoles.length > 0 && (
        <div>
          <div className="muted small">Veto roles</div>
          <div className="inline-list">
            {hints.vetoRoles.map((role) => (
              <Badge key={role} label={role} tone="warning" />
            ))}
          </div>
        </div>
      )}

      {hints.designatedRoles && hints.designatedRoles.length > 0 && (
        <div>
          <div className="muted small">Designated commitment roles</div>
          <div className="inline-list">
            {hints.designatedRoles.map((role) => (
              <Badge key={role} label={role} tone="info" />
            ))}
          </div>
        </div>
      )}

      {hints.description && <p className="muted small">{hints.description}</p>}
    </Wrapper>
  );
}

function FullWrapper({ children, policyVersion }: { children: React.ReactNode; policyVersion?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Policy rules{policyVersion ? ` — ${policyVersion}` : ''}</CardTitle>
      </CardHeader>
      <CardContent className="stack">{children}</CardContent>
    </Card>
  );
}

function CompactWrapper({ children }: { children: React.ReactNode; policyVersion?: string }) {
  return <div className="stack">{children}</div>;
}
