export type ProxyService = 'example' | 'control-plane';

interface ServiceConfig {
  service: ProxyService;
  baseUrl: string;
  authHeaderName?: string;
  authToken?: string;
}

export function getIntegrationConfig(service: ProxyService): ServiceConfig {
  if (service === 'example') {
    return {
      service,
      baseUrl: process.env.EXAMPLE_SERVICE_BASE_URL ?? 'http://localhost:3000',
      authHeaderName: 'x-api-key',
      authToken: process.env.EXAMPLE_SERVICE_API_KEY ?? ''
    };
  }

  return {
    service,
    baseUrl: process.env.CONTROL_PLANE_BASE_URL ?? 'http://localhost:3001',
    authHeaderName: 'authorization',
    authToken: process.env.CONTROL_PLANE_API_KEY ?? ''
  };
}

export function buildUpstreamUrl(service: ProxyService, path: string, search?: string): string {
  const config = getIntegrationConfig(service);
  const normalizedBase = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}${search ?? ''}`;
}
