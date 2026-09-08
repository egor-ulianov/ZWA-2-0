function normalizeJavaScriptResult(result, definitionId, index) {
  if (!result || typeof result !== 'object') return null;

  const normalized = {
    id:
      typeof result.id === 'string' && result.id.length > 0
        ? result.id
        : `${definitionId}-${index + 1}`,
    ok: Boolean(result.ok),
    text: String(result.text == null ? '' : result.text).slice(0, 2000),
  };

  if (typeof result.hint === 'string' && result.hint.length > 0) {
    normalized.hint = result.hint.slice(0, 1000);
  }

  return normalized;
}

function createJavaScriptDefinition(stepIndex, label, hint) {
  const id = `javascript-step-${stepIndex + 1}`;
  return Object.freeze({
    id,
    label,
    hint,
    run({ result }) {
      return (Array.isArray(result) ? result : [])
        .map((entry, index) => normalizeJavaScriptResult(entry, id, index))
        .filter(Boolean);
    },
  });
}

const semanticHtmlDefinition = Object.freeze({
  id: 'semantic-html',
  label: 'Semantic HTML',
  hint: 'Describe the page structure with meaningful landmarks.',
  run({ source }) {
    const hasMainLandmark = /<main(?:\s[^>]*)?>[\s\S]*<\/main\s*>/i.test(source);

    return [
      {
        id: 'main-landmark',
        ok: hasMainLandmark,
        text: hasMainLandmark
          ? 'Main landmark requirement met'
          : 'Main landmark requirement not met',
        hint: 'The page identifies its primary content region.',
      },
    ];
  },
});

const javascriptDefinitions = Object.freeze([
  createJavaScriptDefinition(
    0,
    'Variables and types',
    'Expose the values needed by the exercise through the provided module boundary.',
  ),
  createJavaScriptDefinition(
    1,
    'Functions and conditions',
    'Check the function behavior with both branches and an invalid input.',
  ),
  createJavaScriptDefinition(2, 'For loops', 'Check the accumulated value for the exercise input.'),
  createJavaScriptDefinition(
    3,
    'Arrays and objects',
    'Check that the collection is reduced to the expected total.',
  ),
  createJavaScriptDefinition(
    4,
    'DOM selectors',
    'Check the owned preview element after the script runs.',
  ),
  createJavaScriptDefinition(5, 'Events', 'Check the counter after its button interaction.'),
  createJavaScriptDefinition(
    6,
    'Alert and confirm',
    'Check both notification paths without exposing their implementation.',
  ),
]);

function getJavaScriptDefinition(stepIndex = 0) {
  const index = Math.max(0, Math.min(Number(stepIndex) || 0, javascriptDefinitions.length - 1));
  return javascriptDefinitions[index];
}

export { getJavaScriptDefinition, javascriptDefinitions, semanticHtmlDefinition };
