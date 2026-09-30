import { UNICODE_TO_SULEKH_MAP } from './maps/unicodeToSulekh.map.js';

const array_one = UNICODE_TO_SULEKH_MAP;
const array_one_length = array_one.length;

function replaceSymbolsUnicodeToSulekh(modified_substring) {
  if (modified_substring === '') return modified_substring;

  modified_substring = modified_substring.replace(/;/g, 'ñ');
  modified_substring = modified_substring.replace(/ત્ર્/g, 'X');
  modified_substring = modified_substring.replace(/ક્ષ્/g, 'x');
  modified_substring = modified_substring.replace(/શ્ર્ન/g, '—');
  modified_substring = modified_substring.replace(/શ્ર્/g, 'W');
  modified_substring = modified_substring.replace(/ર્/g, 'ô');
  modified_substring = modified_substring.replace(/X/g, 'ત્ર્');
  modified_substring = modified_substring.replace(/x/g, 'ક્ષ્');
  modified_substring = modified_substring.replace(/િં/g, 'i');
  modified_substring = modified_substring.replace(/િ/g, 'ã');
  modified_substring = modified_substring.replace(/ô([કખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહળ])([્])/g, '$1$2ô');
  modified_substring = modified_substring.replace(/ô([કખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહળ])([્])/g, '$1$2ô');
  modified_substring = modified_substring.replace(
    /ô([કખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહળ])([ાીુૂૃેૈોૌંઁૅૉ઼]*)/g,
    '$1$2ô'
  );
  modified_substring = modified_substring.replace(/ીô/g, 'þ');
  modified_substring = modified_substring.replace(/ંô/g, 'õ');
  modified_substring = modified_substring.replace(/ôã/g, 'ãô');
  modified_substring = modified_substring.replace(/ôi/g, 'ãõ');
  modified_substring = modified_substring.replace(
    /([કખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહળ])([iã])/g,
    '$2$1'
  );
  modified_substring = modified_substring.replace(
    /([કખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહળ])(્)([*iã])/g,
    '$3$1$2'
  );
  modified_substring = modified_substring.replace(
    /([કખગઘઙચછજઝઞટઠડઢણતથદધનપફબભમયરલવશષસહળ])(્)([iã])/g,
    '$3$1$2'
  );
  modified_substring = modified_substring.replace(/[્]([ \,\;\.।\n\-\:])/g, 'z$1');

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
  return modified_substring;
}

export function unicodeToSulekh(text) {
  if (!text) return text;
  const maxTextSize = 6000;
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
    processed += replaceSymbolsUnicodeToSulekh(chunk);
  }
  return processed;
}
