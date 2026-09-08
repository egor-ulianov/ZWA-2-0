import assert from 'node:assert/strict';
import test from 'node:test';

import { ApiError, createSerializedRequestQueue, request } from '../../src/lib/apiClient.js';

test('client turns a network failure into a safe request error without exposing response internals', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new TypeError('socket ECONNRESET secret=not-for-ui'); };
  try {
    await assert.rejects(request('/api/attendance'), (error) => error instanceof ApiError && error.status === 0 && error.message === 'Network request failed');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('serialized requests cannot start a newer attendance snapshot before the prior one settles', async () => {
  const started = [];
  const finishers = [];
  const queue = createSerializedRequestQueue((snapshot) => new Promise((resolve) => {
    started.push(snapshot);
    finishers.push(() => resolve(snapshot));
  }));

  const first = queue.enqueue('first');
  const second = queue.enqueue('second');
  assert.deepEqual(started, ['first']);

  finishers.shift()();
  await first;
  assert.deepEqual(started, ['first', 'second']);

  finishers.shift()();
  assert.equal(await second, 'second');
});

test('serialized requests keep processing after a failed write so retry can use the latest state', async () => {
  const started = [];
  const queue = createSerializedRequestQueue(async (snapshot) => {
    started.push(snapshot);
    if (snapshot === 'stale') throw new ApiError('Unable to save attendance', { status: 500 });
    return snapshot;
  });

  await assert.rejects(queue.enqueue('stale'), ApiError);
  assert.equal(await queue.enqueue('retry'), 'retry');
  assert.deepEqual(started, ['stale', 'retry']);
});
