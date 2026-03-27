import { describe, it, expect, beforeEach } from 'vitest';
import { usePreferencesStore } from './preferences-store';

describe('usePreferencesStore', () => {
  beforeEach(() => {
    usePreferencesStore.setState({
      theme: 'dark',
      demoMode: true,
      autoFollow: true,
      showCriticalPath: true,
      showParallelBranches: true,
      replaySpeed: 1,
      logsDensity: 'comfortable'
    });
  });

  it('has correct default values', () => {
    const state = usePreferencesStore.getState();
    expect(state.theme).toBe('dark');
    expect(state.autoFollow).toBe(true);
    expect(state.showCriticalPath).toBe(true);
    expect(state.replaySpeed).toBe(1);
    expect(state.logsDensity).toBe('comfortable');
  });

  it('toggleTheme switches dark to light', () => {
    usePreferencesStore.getState().toggleTheme();
    expect(usePreferencesStore.getState().theme).toBe('light');
  });

  it('toggleTheme switches light to dark', () => {
    usePreferencesStore.setState({ theme: 'light' });
    usePreferencesStore.getState().toggleTheme();
    expect(usePreferencesStore.getState().theme).toBe('dark');
  });

  it('setDemoMode updates demoMode', () => {
    usePreferencesStore.getState().setDemoMode(false);
    expect(usePreferencesStore.getState().demoMode).toBe(false);
  });

  it('setAutoFollow updates autoFollow', () => {
    usePreferencesStore.getState().setAutoFollow(false);
    expect(usePreferencesStore.getState().autoFollow).toBe(false);
  });

  it('setReplaySpeed updates replaySpeed', () => {
    usePreferencesStore.getState().setReplaySpeed(2);
    expect(usePreferencesStore.getState().replaySpeed).toBe(2);
  });

  it('setLogsDensity updates logsDensity', () => {
    usePreferencesStore.getState().setLogsDensity('compact');
    expect(usePreferencesStore.getState().logsDensity).toBe('compact');
  });

  it('setShowCriticalPath updates showCriticalPath', () => {
    usePreferencesStore.getState().setShowCriticalPath(false);
    expect(usePreferencesStore.getState().showCriticalPath).toBe(false);
  });
});
