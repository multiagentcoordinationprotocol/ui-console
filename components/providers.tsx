'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ToastProvider } from '@/components/ui/toast';
import { usePreferencesStore } from '@/lib/stores/preferences-store';
import type { AppPreferences } from '@/lib/types';

/**
 * R3.3 — apply the theme + design-version to <html> on the client.
 *
 * `designVersion` is persisted in the preferences store, but can be
 * overridden via the `?design=v1|v2` URL query param. If present, the
 * override is written back to the store so it sticks for subsequent
 * navigations (until another URL override or an in-app toggle).
 */
function isDesignVersion(value: string | null): value is AppPreferences['designVersion'] {
  return value === 'v1' || value === 'v2';
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      })
  );
  const theme = usePreferencesStore((state) => state.theme);
  const designVersion = usePreferencesStore((state) => state.designVersion);
  const setDesignVersion = usePreferencesStore((state) => state.setDesignVersion);

  // Apply theme → data-theme on <html>. Existing behaviour; kept intact.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // R3.3: apply design version → data-design on <html>, and honour
  // ?design=v1|v2 URL overrides on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryDesign = params.get('design');
    if (isDesignVersion(queryDesign) && queryDesign !== designVersion) {
      setDesignVersion(queryDesign);
      return; // next effect run will apply it
    }
    document.documentElement.dataset.design = designVersion;
  }, [designVersion, setDesignVersion]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
