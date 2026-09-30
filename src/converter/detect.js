import { sulekhToUnicode } from './sulekhToUnicode.js';

const GUJARATI_RE = /[\u0A80-\u0AFF]/;
const LATIN_EXTENDED =
  /[A-Za-z\u00C0-\u00FF\u00BC\u00BD\u00BE]/;

export function detectScriptType(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return 'unicode';

  let gujarati = 0;
  let latin = 0;
  for (const ch of trimmed) {
    if (GUJARATI_RE.test(ch)) gujarati++;
    else if (LATIN_EXTENDED.test(ch)) latin++;
  }

  if (gujarati >= 2 && gujarati >= latin) return 'unicode';
  return 'sulekh';
}

export function preparePlaylistText(text) {
  const kind = detectScriptType(text);
  if (kind === 'sulekh') {
    return { unicode: sulekhToUnicode(text), converted: true, inputKind: kind };
  }
  return { unicode: text, converted: false, inputKind: kind };
}
