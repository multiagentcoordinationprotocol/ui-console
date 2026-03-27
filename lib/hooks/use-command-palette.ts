'use client';

import { useEffect, useMemo, useState } from 'react';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  href?: string;
  action?: () => void;
  keywords?: string[];
}

export function useCommandPalette(items: CommandItem[]) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    const openListener = () => setOpen(true);
    const closeListener = () => setOpen(false);

    window.addEventListener('keydown', listener);
    window.addEventListener('macp:open-command-palette', openListener as EventListener);
    window.addEventListener('macp:close-command-palette', closeListener as EventListener);
    return () => {
      window.removeEventListener('keydown', listener);
      window.removeEventListener('macp:open-command-palette', openListener as EventListener);
      window.removeEventListener('macp:close-command-palette', closeListener as EventListener);
    };
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter((item) =>
      [item.label, item.description, ...(item.keywords ?? [])].filter(Boolean).join(' ').toLowerCase().includes(lower)
    );
  }, [items, query]);

  return {
    open,
    query,
    filtered,
    setOpen,
    setQuery,
    reset: () => {
      setOpen(false);
      setQuery('');
    }
  };
}
