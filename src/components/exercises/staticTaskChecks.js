const MAX_STATIC_SOURCE_LENGTH = 24000;
const MAX_STATIC_MARKER_LENGTH = 200;
const MAX_STATIC_CHECKS = 64;

function boundedSource(source) {
  return typeof source === 'string' ? source.slice(0, MAX_STATIC_SOURCE_LENGTH) : '';
}

function boundedMarker(marker) {
  return typeof marker === 'string' ? marker.slice(0, MAX_STATIC_MARKER_LENGTH) : '';
}

function runStaticTaskChecks(definition, source = '') {
  const bounded = boundedSource(source);
  const required = Array.isArray(definition?.required) ? definition.required : [];
  const hints = Array.isArray(definition?.hints) ? definition.hints : [];
  const definitionId =
    typeof definition?.id === 'string' && definition.id.length > 0 ? definition.id : 'static';

  return required.slice(0, MAX_STATIC_CHECKS).map((requiredMarker, index) => {
    const marker = boundedMarker(requiredMarker);
    const ok = marker.length > 0 && bounded.includes(marker);
    const result = {
      id: `${definitionId}-required-${index + 1}`,
      ok,
      text: ok ? `Požadavek „${marker}“ je splněn.` : `Požadavek „${marker}“ nebyl nalezen.`,
    };
    const hint = typeof hints[index] === 'string' ? hints[index].slice(0, 1000) : '';
    if (hint) result.hint = hint;
    return result;
  });
}

export { MAX_STATIC_SOURCE_LENGTH, runStaticTaskChecks };

export default runStaticTaskChecks;
