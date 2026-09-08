function getSlideIds(slides) {
  return Array.isArray(slides)
    ? slides.filter((slide) => slide && typeof slide.id === "string").map((slide) => slide.id)
    : [];
}

function prefersReducedMotion() {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getScrollBehavior(reducedMotion = prefersReducedMotion()) {
  return reducedMotion ? "auto" : "smooth";
}

function scrollToId(id, { block = "start", inline = "nearest" } = {}) {
  if (typeof document === "undefined") return false;
  const element = document.getElementById(id);
  if (!element || typeof element.scrollIntoView !== "function") return false;
  element.scrollIntoView({ behavior: getScrollBehavior(), block, inline });
  return true;
}

function decodeHash(hash) {
  if (typeof hash !== "string") return "";
  const value = hash.replace(/^#/, "");
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function resolveSlideId(slides, location = {}) {
  const ids = getSlideIds(slides);
  if (ids.length === 0) return undefined;

  const search = typeof location.search === "string" ? location.search : "";
  const querySlide = new URLSearchParams(search).get("slide");
  if (ids.includes(querySlide)) return querySlide;

  const hashSlide = decodeHash(location.hash);
  if (ids.includes(hashSlide)) return hashSlide;

  return ids[0];
}

function getSlideDomIds(slideId, idPrefix = "lesson") {
  const safePrefix = String(idPrefix).replace(/[^a-zA-Z0-9_-]/g, "-");
  const safeSlideId = String(slideId).replace(/[^a-zA-Z0-9_-]/g, "-");
  return {
    tabId: `${safePrefix}-tab-${safeSlideId}`,
    panelId: `${safePrefix}-panel-${safeSlideId}`,
  };
}

function buildSlideUrl(location, slideId) {
  const pathname = location.pathname || "/";
  const current = new URL(
    location.href || `${pathname}${location.search || ""}${location.hash || ""}`,
    "http://localhost"
  );
  current.searchParams.set("slide", slideId);
  current.hash = "";
  return `${current.pathname}${current.search}${current.hash}`;
}

module.exports = {
  buildSlideUrl,
  getScrollBehavior,
  getSlideDomIds,
  getSlideIds,
  resolveSlideId,
  scrollToId,
};
