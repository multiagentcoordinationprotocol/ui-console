import type { ProxyService } from '@/lib/server/integrations';

export async function fetchJson<T>(service: ProxyService, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/proxy/${service}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function buildProxyUrl(service: ProxyService, path: string): string {
  return `/api/proxy/${service}${path}`;
}
