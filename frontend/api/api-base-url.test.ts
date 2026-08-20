import { describe, expect, it } from 'vitest';

import { PRODUCTION_API_ORIGIN, resolveApiBaseUrl } from './api-base-url';

describe('API base URL resolver', () => {
  it('always uses the production origin in production builds', () => {
    // Given
    const configured = 'http://localhost:3000';

    // When
    const result = resolveApiBaseUrl(configured, true);

    // Then
    expect(result).toBe(PRODUCTION_API_ORIGIN);
  });

  it('allows exact production and loopback origins with explicit ports in development', () => {
    // Given
    const candidates = [
      PRODUCTION_API_ORIGIN,
      'http://localhost:8080',
      'https://localhost:8443',
      'http://127.0.0.1:8080',
      'https://127.0.0.1:8443',
    ];

    // When
    const results = candidates.map((candidate) =>
      resolveApiBaseUrl(candidate, false),
    );

    // Then
    expect(results).toEqual(candidates);
  });

  it('fails closed for untrusted, downgraded, credentialed, or non-origin values', () => {
    // Given
    const candidates = [
      'http://evil.example',
      'http://mallo-api.site',
      'http://user:pass@localhost:3000',
      'http://localhost:3000/path',
      'http://localhost:3000?query=yes',
      'http://localhost:3000#fragment',
      'http://127.0.0.1',
      'https://localhost.evil.example:8443',
    ];

    // When
    const results = candidates.map((candidate) =>
      resolveApiBaseUrl(candidate, false),
    );

    // Then
    expect(results).toEqual(candidates.map(() => PRODUCTION_API_ORIGIN));
  });
});
