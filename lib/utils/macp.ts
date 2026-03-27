import type { RunRecord, ScenarioSummary } from '@/lib/types';

export function parseScenarioRef(scenarioRef?: string | null) {
  if (!scenarioRef) {
    return { packSlug: undefined, scenarioSlug: undefined, version: undefined };
  }

  const [packAndScenario, version] = scenarioRef.split('@');
  const [packSlug, ...scenarioParts] = packAndScenario.split('/');
  return {
    packSlug,
    scenarioSlug: scenarioParts.join('/'),
    version
  };
}

export function getScenarioRefFromRun(run?: RunRecord | null) {
  return String(run?.metadata?.scenarioRef ?? run?.source?.ref ?? '');
}

export function getRunDurationMs(run?: RunRecord | null) {
  if (!run?.startedAt) return 0;
  const start = new Date(run.startedAt).getTime();
  const end = run.endedAt ? new Date(run.endedAt).getTime() : Date.now();
  return Math.max(0, end - start);
}

export function getScenarioName(
  packSlug: string | undefined,
  scenarioSlug: string | undefined,
  scenarios: ScenarioSummary[]
) {
  const match = scenarios.find((scenario) => scenario.scenario === scenarioSlug);
  if (match) return match.name;
  if (!packSlug && !scenarioSlug) return 'Unknown scenario';
  return [packSlug, scenarioSlug].filter(Boolean).join('/');
}

export function optionValue(value: string | undefined, fallback = '') {
  return value ?? fallback;
}

export function unique<T>(items: T[]) {
  return [...new Set(items)];
}
