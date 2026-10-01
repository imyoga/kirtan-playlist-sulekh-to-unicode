import { sulekhToUnicode } from './sulekhToUnicode.js';

const GUJARATI_RE = /[\u0A80-\u0AFF]/;
const LATIN_RE = /[A-Za-z\u00C0-\u00FF\u00BC\u00BD\u00BE]/;

export function detectScriptType(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return 'unicode';

  // If ANY latin/sulekh characters are present, treat as sulekh and convert.
  // Only skip conversion when the text is purely Gujarati unicode (no latin at all).
  const hasLatin = LATIN_RE.test(trimmed);
  const hasGujarati = GUJARATI_RE.test(trimmed);

  if (hasGujarati && !hasLatin) return 'unicode';
  return 'sulekh';
}

export function preparePlaylistText(text) {
  const kind = detectScriptType(text);
  if (kind === 'sulekh') {
    return { unicode: sulekhToUnicode(text), converted: true, inputKind: kind };
  }
  return { unicode: text, converted: false, inputKind: kind };
}
