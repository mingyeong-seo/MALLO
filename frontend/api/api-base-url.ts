export const PRODUCTION_API_ORIGIN = 'https://mallo-api.site';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1']);

export function resolveApiBaseUrl(
  configuredValue: string | undefined,
  isProduction: boolean,
): string {
  if (isProduction) {
    return PRODUCTION_API_ORIGIN;
  }

  const configured = configuredValue?.trim();
  if (!configured || configured === PRODUCTION_API_ORIGIN) {
    return PRODUCTION_API_ORIGIN;
  }

  try {
    const url = new URL(configured);
    const isLoopback = LOOPBACK_HOSTS.has(url.hostname);
    const hasAllowedProtocol = url.protocol === 'http:' || url.protocol === 'https:';
    const isOriginOnly =
      url.username === '' &&
      url.password === '' &&
      url.pathname === '/' &&
      url.search === '' &&
      url.hash === '';

    return isLoopback && hasAllowedProtocol && url.port && isOriginOnly
      ? url.origin
      : PRODUCTION_API_ORIGIN;
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }
    return PRODUCTION_API_ORIGIN;
  }
}
