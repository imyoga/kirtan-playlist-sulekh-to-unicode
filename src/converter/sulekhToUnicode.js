import { SULEKH_TO_UNICODE_MAP } from './maps/sulekhToUnicode.map.js';

const array_one = SULEKH_TO_UNICODE_MAP;
const array_one_length = array_one.length;

function normalizeFractionGlyphs(text) {
  return text
    .replace(/1\u20442/g, '\u00BD')
    .replace(/1\u20444/g, '\u00BC')
    .replace(/3\u20444/g, '\u00BE');
}

function replaceSymbolsSulekhToUnicode(modified_substring) {
  if (modified_substring === '') return modified_substring;
  modified_substring = normalizeFractionGlyphs(modified_substring);

  for (let input_symbol_idx = 0; input_symbol_idx < array_one_length - 1; input_symbol_idx += 2) {
    let idx = 0;
    while (idx !== -1) {
      modified_substring = modified_substring.replace(
        array_one[input_symbol_idx],
        array_one[input_symbol_idx + 1]
      );
      idx = modified_substring.indexOf(array_one[input_symbol_idx]);
    }
  }

  modified_substring = modified_substring.replace(/ý/g, '્ર');
  modified_substring = modified_substring.replace(/\u005C/g, 'ંર્ã');
  modified_substring = modified_substring.replace(/ü/g, 'ર્ã');
  modified_substring = modified_substring.replace(
    /([ãi*])([કખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહળ])/g,
    '$2$1'
  );
  modified_substring = modified_substring.replace(
    /([ãi*])(્)([કખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહળ])/g,
    '$2$3$1'
  );
  modified_substring = modified_substring.replace(
    /([ãi*])(્)([કખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહળ])/g,
    '$2$3$1'
  );
  modified_substring = modified_substring.replace(/ã/g, 'િ');
  modified_substring = modified_substring.replace(/i/g, 'િં');
  modified_substring = modified_substring.replace(/þ/g, 'ôી');
  modified_substring = modified_substring.replace(/õ/g, 'ંô');
  modified_substring = modified_substring.replace(
    /([કખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહળ])([ાિીુૂૃેૈોૌંઁૅૉ઼]*)([ô])/g,
    '$3$1$2'
  );
  modified_substring = modified_substring.replace(
    /([કખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહળ])([્])([ô])/g,
    '$3$1$2'
  );
  modified_substring = modified_substring.replace(
    /([કખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહળ])([્])([ô])/g,
    '$3$1$2'
  );
  modified_substring = modified_substring.replace(/ô/g, 'ર્');
  modified_substring = modified_substring.replace(/([ંઁ॰])([ાિીુૂૃેૈોૌૅૉ])/g, '$2$1');
  modified_substring = modified_substring.replace(
    /([ાિીુૂૃેૈોૌૅૉઁ])([ાિીુૂૃેૈોૌૅૉ])/g,
    '$1'
  );
  return modified_substring;
}

export function sulekhToUnicode(text) {
  if (!text) return text;
  const maxTextSize = 4000;
  const textSize = text.length;
  let processed = '';
  let sthiti1 = 0;
  let sthiti2 = 0;
  let chaleChalo = 1;

  while (chaleChalo === 1) {
    sthiti1 = sthiti2;
    if (sthiti2 < textSize - maxTextSize) {
      sthiti2 += maxTextSize;
      while (sthiti2 > sthiti1 && text.charAt(sthiti2) !== ' ') {
        sthiti2--;
      }
      if (sthiti2 <= sthiti1) sthiti2 = Math.min(sthiti1 + maxTextSize, textSize);
    } else {
      sthiti2 = textSize;
      chaleChalo = 0;
    }
    const chunk = text.substring(sthiti1, sthiti2);
    processed += replaceSymbolsSulekhToUnicode(chunk);
  }
  return processed;
}
