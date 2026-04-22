'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { JsonViewer } from '@/components/ui/json-viewer';
import { LoadingPanel, ErrorPanel } from '@/components/ui/state-panels';
import { getRuntimeModes } from '@/lib/api/client';
import { usePreferencesStore } from '@/lib/stores/preferences-store';

/**
 * /modes/[mode] — single mode detail view.
 *
 * Mirrors /policies/[policyId] — selectable from any mode badge in the
 * workbench (e.g. the Final decision panel header).
 */
export default function ModeDetailPage() {
  const params = useParams<{ mode: string }>();
  const demoMode = usePreferencesStore((state) => state.demoMode);
  const modeName = decodeURIComponent(params.mode);

  const modesQuery = useQuery({
    queryKey: ['runtime-modes', demoMode],
    queryFn: () => getRuntimeModes(demoMode)
  });

  const mode = useMemo(() => (modesQuery.data ?? []).find((m) => m.mode === modeName), [modesQuery.data, modeName]);

  if (modesQuery.isLoading) {
    return <LoadingPanel title="Loading mode" description="Fetching runtime mode descriptor." />;
  }

  if (modesQuery.error) {
    return <ErrorPanel message={String(modesQuery.error)} actionHref="/modes" actionLabel="Back to modes" />;
  }

  if (!mode) {
    return (
      <ErrorPanel
        title="Mode not found"
        message={`No registered runtime mode named ${modeName}.`}
        actionHref="/modes"
        actionLabel="Back to modes"
      />
    );
  }

  return (
    <div className="stack">
      <div className="hero">
        <div>
          <Link href="/modes" className="muted small inline-list" style={{ gap: 4, alignItems: 'center' }}>
            <ArrowLeft size={14} /> Back to modes
          </Link>
          <h1 className="inline-list" style={{ gap: 8, alignItems: 'center' }}>
            <Layers size={20} />
            <code>{mode.mode}</code>
          </h1>
          <p>{mode.description ?? mode.title ?? 'Runtime mode descriptor.'}</p>
        </div>
        <div className="inline-list">
          {mode.modeVersion ? <Badge label={`v${mode.modeVersion}`} tone="info" /> : null}
          {mode.determinismClass ? <Badge label={mode.determinismClass} /> : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mode descriptor</CardTitle>
          <CardDescription>Full runtime mode metadata as registered with the runtime.</CardDescription>
        </CardHeader>
        <CardContent>
          <JsonViewer value={mode} />
        </CardContent>
      </Card>
    </div>
  );
}
