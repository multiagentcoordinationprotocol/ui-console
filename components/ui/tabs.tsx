'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export function Tabs({
  items,
  defaultTab,
  defaultValue,
  className,
  onTabChange
}: {
  items: TabItem[];
  /** @deprecated Use `defaultValue` instead. */
  defaultTab?: string;
  defaultValue?: string;
  className?: string;
  onTabChange?: (id: string) => void;
}) {
  const [active, setActive] = useState(defaultValue ?? defaultTab ?? items[0]?.id);
  const current = items.find((item) => item.id === active) ?? items[0];

  const handleTabChange = (id: string) => {
    setActive(id);
    onTabChange?.(id);
  };

  return (
    <div className={cn('tabs-shell', className)}>
      <div className="tabs-list">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn('tabs-trigger', active === item.id && 'tabs-trigger-active')}
            onClick={() => handleTabChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="tabs-panel">{current?.content}</div>
    </div>
  );
}
