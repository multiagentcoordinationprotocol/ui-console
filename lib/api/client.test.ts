import { describe, it, expect } from 'vitest';
import {
  listPacks,
  listRuns,
  getRun,
  getDashboardOverview,
  compileLaunch,
  getAgentProfiles,
  getLogsData,
  getWebhooks,
  createWebhook,
  getObservabilityRawMetrics,
  cancelRun,
  getRunState,
  getRunEvents,
  listScenarios
} from './client';

const DEMO = true;

describe('demo mode API client', () => {
  it('listPacks returns mock packs array', async () => {
    const packs = await listPacks(DEMO);
    expect(Array.isArray(packs)).toBe(true);
    expect(packs.length).toBeGreaterThan(0);
    expect(packs[0]).toHaveProperty('slug');
    expect(packs[0]).toHaveProperty('name');
  });

  it('listRuns returns all mock runs', async () => {
    const runs = await listRuns(DEMO);
    expect(Array.isArray(runs)).toBe(true);
    expect(runs.length).toBeGreaterThan(0);
    expect(runs[0]).toHaveProperty('id');
    expect(runs[0]).toHaveProperty('status');
  });

  it('listRuns filters by status parameter', async () => {
    const allRuns = await listRuns(DEMO);
    const completedRuns = await listRuns(DEMO, { status: 'completed' });
    expect(completedRuns.length).toBeLessThanOrEqual(allRuns.length);
    completedRuns.forEach((run) => expect(run.status).toBe('completed'));
  });

  it('getRun returns matching mock run', async () => {
    const runs = await listRuns(DEMO);
    const run = await getRun(runs[0].id, DEMO);
    expect(run.id).toBe(runs[0].id);
  });

  it('getRun throws for unknown runId', async () => {
    await expect(getRun('nonexistent-id', DEMO)).rejects.toThrow();
  });

  it('getRunState returns projection for known run', async () => {
    const runs = await listRuns(DEMO);
    const state = await getRunState(runs[0].id, DEMO);
    expect(state).toHaveProperty('graph');
    expect(state).toHaveProperty('participants');
    expect(state).toHaveProperty('decision');
  });

  it('getRunEvents returns events array', async () => {
    const runs = await listRuns(DEMO);
    const events = await getRunEvents(runs[0].id, DEMO);
    expect(Array.isArray(events)).toBe(true);
  });

  it('getDashboardOverview returns kpis, runs, packs, runtimeHealth, charts', async () => {
    const overview = await getDashboardOverview(DEMO);
    expect(overview).toHaveProperty('kpis');
    expect(overview).toHaveProperty('runs');
    expect(overview).toHaveProperty('packs');
    expect(overview).toHaveProperty('runtimeHealth');
    expect(overview).toHaveProperty('charts');
  });

  it('cancelRun returns ok with cancelled status', async () => {
    const runs = await listRuns(DEMO);
    const result = await cancelRun(runs[0].id, DEMO);
    expect(result).toHaveProperty('ok', true);
    expect(result).toHaveProperty('status', 'cancelled');
  });

  it('compileLaunch merges input into compiled result', async () => {
    const result = await compileLaunch(
      { scenarioRef: 'fraud/check@1.0.0', templateId: 'default', inputs: { key: 'value' } },
      DEMO
    );
    expect(result).toHaveProperty('executionRequest');
  });

  it('getAgentProfiles returns agent profile array', async () => {
    const profiles = await getAgentProfiles(DEMO);
    expect(Array.isArray(profiles)).toBe(true);
    expect(profiles.length).toBeGreaterThan(0);
    expect(profiles[0]).toHaveProperty('agentRef');
  });

  it('listScenarios returns scenarios for a pack', async () => {
    const packs = await listPacks(DEMO);
    const scenarios = await listScenarios(packs[0].slug, DEMO);
    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios.length).toBeGreaterThan(0);
    expect(scenarios[0]).toHaveProperty('scenario');
  });

  it('getLogsData returns events for specific runId', async () => {
    const runs = await listRuns(DEMO);
    const events = await getLogsData(DEMO, runs[0].id);
    expect(Array.isArray(events)).toBe(true);
  });

  it('getWebhooks returns mock webhooks', async () => {
    const webhooks = await getWebhooks(DEMO);
    expect(Array.isArray(webhooks)).toBe(true);
  });

  it('createWebhook returns subscription with generated id', async () => {
    const webhook = await createWebhook(
      { url: 'https://example.com', secret: 'test', events: ['run.completed'] },
      DEMO
    );
    expect(webhook).toHaveProperty('id');
    expect(webhook).toHaveProperty('url', 'https://example.com');
  });

  it('getObservabilityRawMetrics returns prometheus string', async () => {
    const metrics = await getObservabilityRawMetrics(DEMO);
    expect(typeof metrics).toBe('string');
    expect(metrics.length).toBeGreaterThan(0);
  });
});
