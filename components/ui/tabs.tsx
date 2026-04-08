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
  className
}: {
  items: TabItem[];
  /** @deprecated Use `defaultValue` instead. */
  defaultTab?: string;
  defaultValue?: string;
  className?: string;
}) {
  const [active, setActive] = useState(defaultValue ?? defaultTab ?? items[0]?.id);
  const current = items.find((item) => item.id === active) ?? items[0];

  return (
    <div className={cn('tabs-shell', className)}>
      <div className="tabs-list">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn('tabs-trigger', active === item.id && 'tabs-trigger-active')}
            onClick={() => setActive(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="tabs-panel">{current?.content}</div>
    </div>
  );
}
