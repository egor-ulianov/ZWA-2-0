export class ApiError extends Error {
  constructor(message, { status = 0, code = 'request_failed' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function isAbortError(error) {
  return error?.name === 'AbortError';
}

export function createAttendanceSnapshotOptions({ date, map, revision }) {
  if (!Number.isSafeInteger(revision) || revision < 0) {
    throw new ApiError('Attendance revision required', {
      status: 428,
      code: 'attendance_revision_required',
    });
  }
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'If-Match': `"${revision}"`,
    },
    body: JSON.stringify({ date, map }),
  };
}

export function mergeServerState(localState, serverState, dirtyFields = new Set()) {
  const merged = { ...(localState || {}), ...(serverState || {}) };
  for (const field of dirtyFields) {
    if (Object.hasOwn(localState || {}, field)) merged[field] = localState[field];
  }
  return merged;
}

export function mergeProgressPatches(failedPatch, pendingPatch, nextPatch) {
  return { ...(failedPatch || {}), ...(pendingPatch || {}), ...(nextPatch || {}) };
}

export function progressPatchForFinalPointsInput(rawValue) {
  if (rawValue === '') return { assignment_final_points: null };
  if (typeof rawValue !== 'string' || !/^\d+$/.test(rawValue)) return null;
  const points = Number(rawValue);
  return Number.isSafeInteger(points) && points >= 0 && points <= 100
    ? { assignment_final_points: points }
    : null;
}

export function buildNormalizationRequestBody({ dryRun, testNumber, maxPoints, runId }) {
  if (!dryRun && (typeof runId !== 'string' || !runId.trim())) {
    throw new ApiError('Run a dry-run before applying normalization', {
      status: 400,
      code: 'normalization_run_required',
    });
  }
  return dryRun ? { testNumber, maxPoints, dryRun: true } : { runId };
}

async function responsePayload(response) {
  const contentType = response.headers?.get?.('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json().catch((error) => {
      if (isAbortError(error)) throw error;
      return {};
    });
  }
  return response.text().catch((error) => {
    if (isAbortError(error)) throw error;
    return '';
  });
}

export async function request(path, { onUnauthorized, ...options } = {}) {
  let response;
  try {
    response = await fetch(path, {
      credentials: 'same-origin',
      ...options,
      headers: { Accept: 'application/json', ...(options.headers || {}) },
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ApiError('Network request failed');
  }
  const payload = await responsePayload(response);
  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload?.error ? payload.error : 'Request failed';
    const error = new ApiError(message, {
      status: response.status,
      code: typeof payload === 'object' ? payload?.code : undefined,
    });
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
    Promise.resolve(result).then(
      (value) => {
        active = false;
        pump();
        job.resolve(value);
      },
      (error) => {
        active = false;
        pump();
        job.reject(error);
      },
    );
  }

  return {
    enqueue(value) {
      return new Promise((resolve, reject) => {
        pending.push({ value, resolve, reject });
        pump();
      });
    },
    clearPending(error = new ApiError('Queued request cancelled')) {
      const queued = pending.splice(0);
      queued.forEach((job) => job.reject(error));
    },
    get pendingCount() {
      return pending.length + (active ? 1 : 0);
    },
  };
}

export function isUnauthorized(error) {
  return error instanceof ApiError && error.status === 401;
}
