function getKnownSectionIds(sections) {
  return new Set(
    Array.isArray(sections)
      ? sections
          .filter((section) => section && typeof section.id === 'string' && section.id.length > 0)
          .map((section) => section.id)
      : [],
  );
}

function parsePresenterMessage(message, sections, lessonSlug) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) return null;
  if (message.type !== 'slide-change') return null;
  if (typeof lessonSlug !== 'string' || !lessonSlug || message.lessonSlug !== lessonSlug) {
    return null;
  }
  if (typeof message.slideId !== 'string' || !getKnownSectionIds(sections).has(message.slideId)) {
    return null;
  }
  return { slideId: message.slideId };
}

function presenterChannelName(lessonSlug) {
  return `zwa-presenter-${encodeURIComponent(lessonSlug)}`;
}

function createPresenterChannel({ lessonSlug, slides, onSlide }) {
  const knownSectionIds = getKnownSectionIds(slides);
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
      if (closed || !knownSectionIds.has(slideId)) return;
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
