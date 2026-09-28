import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPresenterChannel,
  parsePresenterMessage,
} from '../../src/course-ui/presentation/presenterChannel.js';
import { resolveExperienceMode } from '../../src/course-ui/learning/navigation.js';

const slides = [{ id: 'intro' }, { id: 'html' }];

test('presenter messages ignore malformed, foreign, and unknown slide ids', () => {
  assert.equal(
    parsePresenterMessage({ lessonSlug: 'html5', slideId: 'unknown' }, slides, 'html5'),
    null,
  );
  assert.equal(
    parsePresenterMessage({ lessonSlug: 'other', slideId: 'intro' }, slides, 'html5'),
    null,
  );
  assert.deepEqual(
    parsePresenterMessage(
      { type: 'slide-change', lessonSlug: 'html5', slideId: 'intro' },
      slides,
      'html5',
    ),
    { slideId: 'intro' },
  );
});

test('lesson mode accepts only student, projector, and presenter', () => {
  assert.equal(resolveExperienceMode({ search: '?mode=projector' }), 'projector');
  assert.equal(resolveExperienceMode({ search: '?mode=presenter' }), 'presenter');
  assert.equal(resolveExperienceMode({ search: '?mode=admin' }), 'student');
  assert.equal(resolveExperienceMode({ search: '' }), 'student');
});

test('presenter channel publishes only known slide ids and closes cleanly', () => {
  const messages = [];
  const originalBroadcastChannel = globalThis.BroadcastChannel;

  class FakeBroadcastChannel {
    static instances = [];

    constructor(name) {
      this.name = name;
      this.closed = false;
      this.sent = [];
      FakeBroadcastChannel.instances.push(this);
    }

    postMessage(message) {
      this.sent.push(message);
    }

    close() {
      this.closed = true;
    }
  }

  globalThis.BroadcastChannel = FakeBroadcastChannel;
  try {
    const channel = createPresenterChannel({
      lessonSlug: 'html5',
      slides,
      onSlide: (slideId) => messages.push(slideId),
    });

    channel.publishSlide('missing');
    channel.publishSlide('html');
    assert.deepEqual(FakeBroadcastChannel.instances[0].sent, [
      { type: 'slide-change', lessonSlug: 'html5', slideId: 'html' },
    ]);

    FakeBroadcastChannel.instances[0].onmessage({
      data: { type: 'slide-change', lessonSlug: 'other', slideId: 'intro' },
    });
    FakeBroadcastChannel.instances[0].onmessage({
      data: { type: 'slide-change', lessonSlug: 'html5', slideId: 'intro' },
    });
    assert.deepEqual(messages, ['intro']);

    channel.close();
    assert.equal(FakeBroadcastChannel.instances[0].closed, true);
  } finally {
    globalThis.BroadcastChannel = originalBroadcastChannel;
  }
});
