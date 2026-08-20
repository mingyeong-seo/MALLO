export const API_BASE_URL = 'https://mallo-api.site';

export type ApiErrorKind = 'HTTP' | 'NETWORK' | 'INVALID_RESPONSE';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options?: { cause?: unknown; status?: number },
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options?.status;

    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function resolveApiUrl(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  expectedStatuses?: readonly number[],
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  const isFormDataBody =
    typeof FormData !== 'undefined' && init.body instanceof FormData;

  if (init.body && !isFormDataBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch (error) {
    throw new ApiError('NETWORK', '서버에 연결하지 못했습니다.', {
      cause: error,
    });
  }

  const responseText = await response.text();
  let payload: unknown = null;

  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch (error) {
      if (response.ok) {
        throw new ApiError('INVALID_RESPONSE', '응답 형식이 올바르지 않습니다.', {
          cause: error,
          status: response.status,
        });
      }
    }
  }

  if (!response.ok) {
    throw new ApiError(
      'HTTP',
      getResponseMessage(payload) ?? `요청에 실패했습니다. (${response.status})`,
      { status: response.status },
    );
  }

  if (expectedStatuses && !expectedStatuses.includes(response.status)) {
    throw new ApiError(
      'HTTP',
      `예상하지 못한 응답 상태입니다. (${response.status})`,
      { status: response.status },
    );
  }

  return payload as T;
}

function getResponseMessage(payload: unknown) {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return payload.message;
  }

  return null;
}
