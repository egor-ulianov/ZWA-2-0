function getKnownSlideIds(slides) {
  return new Set(
    Array.isArray(slides)
      ? slides
          .filter((slide) => slide && typeof slide.id === 'string' && slide.id.length > 0)
          .map((slide) => slide.id)
      : [],
  );
}

function parsePresenterMessage(message, slides, lessonSlug) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) return null;
  if (message.type !== 'slide-change') return null;
  if (typeof lessonSlug !== 'string' || !lessonSlug || message.lessonSlug !== lessonSlug) {
    return null;
  }
  if (typeof message.slideId !== 'string' || !getKnownSlideIds(slides).has(message.slideId)) {
    return null;
  }
  return { slideId: message.slideId };
}

function presenterChannelName(lessonSlug) {
  return `zwa-presenter-${encodeURIComponent(lessonSlug)}`;
}

function createPresenterChannel({ lessonSlug, slides, onSlide }) {
  const knownSlideIds = getKnownSlideIds(slides);
  const canUseBroadcastChannel =
    typeof BroadcastChannel === 'function' &&
    typeof lessonSlug === 'string' &&
    lessonSlug.length > 0;

  if (!canUseBroadcastChannel) {
    return {
      publishSlide() {},
      close() {},
    };
  }

  const channel = new BroadcastChannel(presenterChannelName(lessonSlug));
  let closed = false;
  channel.onmessage = (event) => {
    if (closed) return;
    const parsed = parsePresenterMessage(event?.data, slides, lessonSlug);
    if (parsed && typeof onSlide === 'function') onSlide(parsed.slideId);
  };

  return {
    publishSlide(slideId) {
      if (closed || !knownSlideIds.has(slideId)) return;
      channel.postMessage({ type: 'slide-change', lessonSlug, slideId });
    },
    close() {
      if (closed) return;
      closed = true;
      channel.close();
    },
  };
}

export { createPresenterChannel, parsePresenterMessage, presenterChannelName };
