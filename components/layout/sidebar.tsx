'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Bot,
  FolderKanban,
  Gauge,
  History,
  Layers,
  LucideIcon,
  Logs,
  Play,
  Radar,
  Scale,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const primaryNavItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Gauge },
  { href: '/scenarios', label: 'Scenarios', icon: FolderKanban },
  { href: '/runs/live', label: 'Live Runs', icon: Play },
  { href: '/runs', label: 'Run History', icon: History },
  { href: '/agents', label: 'Agents', icon: Bot },
  { href: '/logs', label: 'Logs', icon: Logs },
  { href: '/traces', label: 'Traces', icon: Radar },
  { href: '/observability', label: 'Observability', icon: Activity },
  { href: '/policies', label: 'Policies', icon: Scale },
  { href: '/modes', label: 'Modes', icon: Layers },
  { href: '/settings', label: 'Settings', icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">M</div>
        <div>
          <div className="sidebar-title">MACP Console</div>
          <div className="sidebar-subtitle">Orchestration + observability</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={cn('sidebar-link', active && 'sidebar-link-active')}>
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <span className="pill">App Router</span>
        <span className="pill">Demo-ready</span>
      </div>
    </aside>
  );
}
