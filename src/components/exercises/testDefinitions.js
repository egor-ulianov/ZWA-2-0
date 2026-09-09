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
  label: 'Sémantické HTML',
  hint: 'Popište strukturu stránky pomocí významových orientačních bodů.',
  run({ source }) {
    const hasMainLandmark = /<main(?:\s[^>]*)?>[\s\S]*<\/main\s*>/i.test(source);

    return [
      {
        id: 'main-landmark',
        ok: hasMainLandmark,
        text: hasMainLandmark
          ? 'Požadavek na hlavní orientační bod je splněn'
          : 'Požadavek na hlavní orientační bod nebyl splněn',
        hint: 'Stránka označuje svou hlavní oblast obsahu.',
      },
    ];
  },
});

const javascriptDefinitions = Object.freeze([
  createJavaScriptDefinition(
    0,
    'Proměnné a typy',
    'Zpřístupněte hodnoty potřebné pro úlohu přes poskytnuté rozhraní modulu.',
  ),
  createJavaScriptDefinition(
    1,
    'Funkce a podmínky',
    'Ověřte chování funkce pro obě větve a neplatný vstup.',
  ),
  createJavaScriptDefinition(2, 'Cykly for', 'Ověřte nahromaděnou hodnotu pro vstup úlohy.'),
  createJavaScriptDefinition(
    3,
    'Pole a objekty',
    'Ověřte, že je kolekce zredukována na očekávaný součet.',
  ),
  createJavaScriptDefinition(
    4,
    'Selektory DOM',
    'Po spuštění skriptu ověřte prvek ve vlastním náhledu.',
  ),
  createJavaScriptDefinition(5, 'Události', 'Ověřte čítač po interakci s tlačítkem.'),
  createJavaScriptDefinition(
    6,
    'Alert a confirm',
    'Ověřte obě cesty upozornění bez odhalení jejich implementace.',
  ),
]);

function getJavaScriptDefinition(stepIndex = 0) {
  const index = Math.max(0, Math.min(Number(stepIndex) || 0, javascriptDefinitions.length - 1));
  return javascriptDefinitions[index];
}

export { getJavaScriptDefinition, javascriptDefinitions, semanticHtmlDefinition };
