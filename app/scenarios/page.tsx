'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { FolderKanban, Play } from 'lucide-react';
import { ScenarioCard } from '@/components/scenarios/scenario-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/field';
import { LoadingPanel, ErrorPanel } from '@/components/ui/state-panels';
import { listPacks, listScenarios } from '@/lib/api/client';
import { usePreferencesStore } from '@/lib/stores/preferences-store';

export default function ScenariosPage() {
  const demoMode = usePreferencesStore((state) => state.demoMode);
  const [search, setSearch] = useState('');
  const [selectedPack, setSelectedPack] = useState('all');

  const catalogQuery = useQuery({
    queryKey: ['scenario-catalog', demoMode],
    queryFn: async () => {
      const packs = await listPacks(demoMode);
      const scenarios = await Promise.all(
        packs.map(async (pack) => ({ pack, scenarios: await listScenarios(pack.slug, demoMode) }))
      );
      return { packs, scenarios };
    }
  });

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return (catalogQuery.data?.scenarios ?? [])
      .filter((entry) => selectedPack === 'all' || entry.pack.slug === selectedPack)
      .map((entry) => ({
        ...entry,
        scenarios: entry.scenarios.filter((scenario) =>
          [scenario.name, scenario.summary, scenario.scenario, ...(scenario.tags ?? [])]
            .join(' ')
            .toLowerCase()
            .includes(lower)
        )
      }))
      .filter((entry) => entry.scenarios.length > 0);
  }, [catalogQuery.data?.scenarios, search, selectedPack]);

  if (catalogQuery.isLoading)
    return (
      <LoadingPanel title="Loading scenario catalog" description="Gathering packs, templates, and launch metadata." />
    );
  if (catalogQuery.error || !catalogQuery.data)
    return <ErrorPanel message={String(catalogQuery.error ?? 'Scenario catalog is unavailable.')} actionHref="/" />;

  return (
    <div className="stack">
      <div className="hero">
        <div>
          <h1>Scenario catalog</h1>
          <p>Browse launchable MACP packs, inspect supported templates, and jump straight into execution setup.</p>
        </div>
        <Link href="/runs/new" className="button button-primary">
          <Play size={16} />
          Launch run
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter scenarios</CardTitle>
          <CardDescription>Search by pack, scenario slug, summary, or tag.</CardDescription>
        </CardHeader>
        <CardContent className="field-grid">
          <div>
            <label className="field-label">Search</label>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="fraud, trust, onboarding, risk..."
            />
          </div>
          <div>
            <label className="field-label">Pack</label>
            <Select value={selectedPack} onChange={(event) => setSelectedPack(event.target.value)}>
              <option value="all">All packs</option>
              {catalogQuery.data.packs.map((pack) => (
                <option key={pack.slug} value={pack.slug}>
                  {pack.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="stack">
        {filtered.map((entry) => (
          <div key={entry.pack.slug} className="stack">
            <div className="section-header">
              <div>
                <h2 className="section-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <FolderKanban size={18} />
                  {entry.pack.name}
                </h2>
                <p className="section-description">{entry.pack.description}</p>
              </div>
            </div>
            <div className="grid-2">
              {entry.scenarios.map((scenario) => (
                <ScenarioCard
                  key={`${entry.pack.slug}-${scenario.scenario}`}
                  packSlug={entry.pack.slug}
                  scenario={scenario}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
