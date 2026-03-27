'use client';

import { useParams } from 'next/navigation';
import { RunWorkbench } from '@/components/runs/run-workbench';

export default function HistoricalRunDetailPage() {
  const params = useParams<{ runId: string }>();
  return <RunWorkbench runId={params.runId} />;
}
