'use client';

import Link from 'next/link';
import { Command, Moon, Play, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePreferencesStore } from '@/lib/stores/preferences-store';

export function Topbar() {
  const theme = usePreferencesStore((state) => state.theme);
  const demoMode = usePreferencesStore((state) => state.demoMode);
  const toggleTheme = usePreferencesStore((state) => state.toggleTheme);
  const setDemoMode = usePreferencesStore((state) => state.setDemoMode);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <Badge label={process.env.NEXT_PUBLIC_MACP_ENVIRONMENT_LABEL ?? 'local-dev'} tone="info" />
        <span className="topbar-help">⌘K opens command palette</span>
      </div>
      <div className="topbar-actions">
        <label className="switch-row">
          <input type="checkbox" checked={demoMode} onChange={(event) => setDemoMode(event.target.checked)} />
          <span>Demo mode</span>
        </label>
        <Button variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            window.dispatchEvent(new Event('macp:open-command-palette'));
          }}
        >
          <Command size={16} />
          Search
        </Button>
        <Link href="/runs/new" className="button button-primary">
          <Play size={16} />
          New Run
        </Link>
      </div>
    </header>
  );
}
