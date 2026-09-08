export class ApiError extends Error {
  constructor(message, { status = 0, code = 'request_failed' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function responsePayload(response) {
  const contentType = response.headers?.get?.('content-type') || '';
  if (contentType.includes('application/json')) return response.json().catch(() => ({}));
  return response.text().catch(() => '');
}

export async function request(path, { onUnauthorized, ...options } = {}) {
  let response;
  try {
    response = await fetch(path, {
      credentials: 'same-origin',
      ...options,
      headers: { Accept: 'application/json', ...(options.headers || {}) },
    });
  } catch (_) {
    throw new ApiError('Network request failed');
  }
  const payload = await responsePayload(response);
  if (!response.ok) {
    const message = typeof payload === 'object' && payload?.error ? payload.error : 'Request failed';
    const error = new ApiError(message, { status: response.status, code: typeof payload === 'object' ? payload?.code : undefined });
    if (response.status === 401) onUnauthorized?.(error);
    throw error;
  }
  return payload;
}

export function createSerializedRequestQueue(write) {
  const pending = [];
  let active = false;

  function pump() {
    if (active || !pending.length) return;
    active = true;
    const job = pending.shift();
    let result;
    try {
      result = write(job.value);
    } catch (error) {
      result = Promise.reject(error);
    }
    Promise.resolve(result).then((value) => {
      active = false;
      pump();
      job.resolve(value);
    }, (error) => {
      active = false;
      pump();
      job.reject(error);
    });
  }

  return {
    enqueue(value) {
      return new Promise((resolve, reject) => {
        pending.push({ value, resolve, reject });
        pump();
      });
    },
    get pendingCount() { return pending.length + (active ? 1 : 0); },
  };
}

export function isUnauthorized(error) {
  return error instanceof ApiError && error.status === 401;
}
