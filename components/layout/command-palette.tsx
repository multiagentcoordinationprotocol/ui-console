'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useCommandPalette, type CommandItem } from '@/lib/hooks/use-command-palette';
import { Input } from '@/components/ui/field';

export function CommandPalette({ items }: { items: CommandItem[] }) {
  const router = useRouter();
  const { open, query, filtered, setOpen, setQuery, reset } = useCommandPalette(items);

  if (!open) return null;

  return (
    <div className="palette-backdrop" onClick={() => reset()}>
      <div className="palette-panel" onClick={(event) => event.stopPropagation()}>
        <div className="palette-search-row">
          <Search size={16} />
          <Input
            placeholder="Jump to pages, actions, or runs..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="palette-list">
          {filtered.map((item) => (
            <button
              key={item.id}
              className="palette-item"
              onClick={() => {
                if (item.action) item.action();
                if (item.href) router.push(item.href);
                reset();
              }}
            >
              <div className="palette-item-title">{item.label}</div>
              {item.description ? <div className="palette-item-description">{item.description}</div> : null}
            </button>
          ))}
          {filtered.length === 0 ? (
            <div className="empty-state compact">
              <h4>No results</h4>
              <p>Try a different keyword or route name.</p>
              <Link href="/runs/new" className="text-link" onClick={() => setOpen(false)}>
                Start a new run
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
