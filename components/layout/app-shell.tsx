'use client';

import { usePathname } from 'next/navigation';
import { CommandPalette } from '@/components/layout/command-palette';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import type { CommandItem } from '@/lib/hooks/use-command-palette';

const commandItems: CommandItem[] = [
  { id: 'dashboard', label: 'Open Dashboard', href: '/', keywords: ['home', 'overview'] },
  { id: 'scenarios', label: 'Open Scenarios', href: '/scenarios', keywords: ['catalog', 'templates'] },
  { id: 'new-run', label: 'Launch New Run', href: '/runs/new', keywords: ['execute', 'start'] },
  { id: 'live-runs', label: 'Open Live Runs', href: '/runs/live', keywords: ['stream', 'active'] },
  { id: 'history', label: 'Open Run History', href: '/runs', keywords: ['historical', 'replay'] },
  { id: 'observability', label: 'Open Observability', href: '/observability', keywords: ['metrics', 'health'] },
  { id: 'logs', label: 'Open Logs', href: '/logs', keywords: ['events', 'canonical'] },
  { id: 'traces', label: 'Open Traces', href: '/traces', keywords: ['artifacts', 'otel'] },
  { id: 'settings', label: 'Open Settings', href: '/settings', keywords: ['preferences', 'webhooks'] }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-shell">
        <Topbar />
        <main className="page">
          <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>
        </main>
      </div>
      <CommandPalette items={commandItems} />
    </div>
  );
}
