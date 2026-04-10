import { vi } from 'vitest';

type ResponseDef = { status: number; body?: unknown; headers?: Record<string, string> };
type RouteHandler = (url: string, init?: RequestInit) => ResponseDef | Promise<ResponseDef>;

/**
 * Intercepts global `fetch` calls to `/api/proxy/...` and routes them
 * to registered handlers. Used by API client integration tests to
 * simulate proxy responses without a running Next.js server.
 */
export class FetchMocker {
  private routes = new Map<string, RouteHandler>();
  private recorded: Array<{ url: string; method: string; body?: unknown }> = [];
  private originalFetch: typeof globalThis.fetch | null = null;

  /** Register a handler for METHOD /api/proxy/service/path */
  on(method: string, proxyPath: string, handler: RouteHandler): this {
    this.routes.set(`${method.toUpperCase()} ${proxyPath}`, handler);
    return this;
  }

  /** Register a handler that matches any request starting with the prefix. */
  onPrefix(method: string, prefix: string, handler: RouteHandler): this {
    this.routes.set(`PREFIX:${method.toUpperCase()} ${prefix}`, handler);
    return this;
  }

  get requests(): ReadonlyArray<{ url: string; method: string; body?: unknown }> {
    return this.recorded;
  }

  clearRequests(): void {
    this.recorded = [];
  }

  /** Install the mock — replaces globalThis.fetch. */
  install(): void {
    this.originalFetch = globalThis.fetch;

    const mockFetch = vi.fn(async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method ?? 'GET').toUpperCase();

      let parsedBody: unknown;
      if (init?.body && typeof init.body === 'string') {
        try {
          parsedBody = JSON.parse(init.body);
        } catch {
          parsedBody = init.body;
        }
      }
      this.recorded.push({ url, method, body: parsedBody });

      // Try exact match
      const exactKey = `${method} ${url}`;
      let handler = this.routes.get(exactKey);

      // Try without query string
      if (!handler) {
        const urlNoQuery = url.split('?')[0];
        handler = this.routes.get(`${method} ${urlNoQuery}`);
      }

      // Try prefix match
      if (!handler) {
        for (const [key, h] of this.routes) {
          if (key.startsWith('PREFIX:')) {
            const routePrefix = key.slice(7);
            const [routeMethod, routePath] = routePrefix.split(' ', 2);
            if (method === routeMethod && url.startsWith(routePath)) {
              handler = h;
              break;
            }
          }
        }
      }

      if (!handler) {
        return new Response(JSON.stringify({ error: 'not mocked', url }), {
          status: 404,
          headers: { 'content-type': 'application/json' }
        });
      }

      const result = await handler(url, init);
      const isNullBody = result.status === 204 || result.status === 304;
      return new Response(isNullBody ? null : result.body !== undefined ? JSON.stringify(result.body) : '', {
        status: result.status,
        headers: isNullBody ? {} : { 'content-type': 'application/json', ...(result.headers ?? {}) }
      });
    });

    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
  }

  /** Restore the original fetch. */
  restore(): void {
    if (this.originalFetch) {
      globalThis.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }
}
