const MAX_EXERCISE_SOURCE_LENGTH = 24000;

function normalizeResult(result, definitionId, index) {
  if (!result || typeof result !== 'object') return null;

  const normalized = {
    id:
      typeof result.id === 'string' && result.id.length > 0
        ? result.id
        : `${definitionId || 'exercise'}-${index + 1}`,
    ok: Boolean(result.ok),
    text: String(result.text == null ? '' : result.text).slice(0, 2000),
  };

  if (typeof result.hint === 'string' && result.hint.length > 0) {
    normalized.hint = result.hint.slice(0, 1000);
  }

  return normalized;
}

function runExerciseTests(testDefinition, { source = '', result = [] } = {}) {
  if (!testDefinition || typeof testDefinition.run !== 'function') return [];

  const boundedSource = String(source == null ? '' : source).slice(0, MAX_EXERCISE_SOURCE_LENGTH);
  const boundedResult = Array.isArray(result) ? result.slice(0, 64) : [];

  try {
    const output = testDefinition.run({ source: boundedSource, result: boundedResult });
    if (!Array.isArray(output)) return [];

    return output
      .slice(0, 64)
      .map((entry, index) => normalizeResult(entry, testDefinition.id, index))
      .filter(Boolean);
  } catch (_) {
    return [
      {
        id: `${testDefinition.id || 'exercise'}-runner-error`,
        ok: false,
        text: 'Testy se nepodařilo dokončit.',
      },
    ];
  }
}

export { MAX_EXERCISE_SOURCE_LENGTH, runExerciseTests };
