const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
  path.join(__dirname, '../ui-based-converter/sulekh_to_unicode_7.html'),
  'utf8'
);
const start = html.indexOf('function convert_to_unicode()');
const arrStart = html.indexOf('var array_one = new Array(', start);
const arrEnd = html.indexOf('var array_one_length = array_one.length;', arrStart);
eval(html.substring(arrStart, arrEnd));
const array_one_length = array_one.length;

function normalizeFractionGlyphs(text) {
  return text
    .replace(/1\u20442/g, '\u00BD')
    .replace(/1\u20444/g, '\u00BC')
    .replace(/3\u20444/g, '\u00BE');
}

function convertSulekh(modified_substring) {
  if (modified_substring === '') return modified_substring;
  modified_substring = normalizeFractionGlyphs(modified_substring);

  for (
    let input_symbol_idx = 0;
    input_symbol_idx < array_one_length - 1;
    input_symbol_idx += 2
  ) {
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
  modified_substring = modified_substring.replace(
    /([ંઁ॰])([ાિીુૂૃેૈોૌૅૉ])/g,
    '$2$1'
  );
  modified_substring = modified_substring.replace(
    /([ાિીુૂૃેૈોૌૅૉઁ])([ાિીુૂૃેૈોૌૅૉ])/g,
    '$1'
  );
  return modified_substring;
}

function normalizeForCompare(s) {
  return s
    .replace(/\u200c/g, '')
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findUnconverted(s) {
  const issues = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const code = c.charCodeAt(0);
    if (
      (code >= 0x41 && code <= 0x5a) ||
      (code >= 0x61 && code <= 0x7a) ||
      'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ'.includes(
        c
      ) ||
      c === '¼' ||
      c === '½' ||
      c === '¾' ||
      (c === '⁄' && s[i - 1] && /\d/.test(s[i - 1]))
    ) {
      const ctx = s.slice(Math.max(0, i - 8), Math.min(s.length, i + 12));
      issues.push({ i, c, code, ctx });
    }
  }
  return issues;
}

const ocrFiles = [
  'ocr-1790791615464.txt',
  'ocr-1790791673896.txt',
  'ocr-1790791694543.txt',
  'ocr-1790791711768.txt',
];

if (require.main === module) for (let n = 1; n <= 4; n++) {
  const base = path.join(__dirname, `../sulekh-samples/${n}`);
  const sulekh = fs.readFileSync(path.join(base, `${n}.txt`), 'utf8');
  const ocr = fs.readFileSync(path.join(base, ocrFiles[n - 1]), 'utf8');
  const out = convertSulekh(sulekh);
  fs.writeFileSync(path.join(base, 'converted.txt'), out, 'utf8');

  const unconverted = findUnconverted(out);
  const unique = [...new Map(unconverted.map((u) => [u.c + u.code, u])).values()];
  console.log(`\n=== Sample ${n} ===`);
  console.log(`Unconverted char types: ${unique.length}`);
  for (const u of unique.slice(0, 40)) {
    console.log(`  U+${u.code.toString(16).toUpperCase().padStart(4, '0')} '${u.c}' e.g. ...${u.ctx}...`);
  }

  // line-by-line rough diff on first differing chars
  const ocrLines = normalizeForCompare(ocr).split('\n');
  const outLines = normalizeForCompare(out).split('\n');
  const max = Math.max(ocrLines.length, outLines.length);
  let diffCount = 0;
  for (let li = 0; li < max && diffCount < 15; li++) {
    const a = ocrLines[li] || '';
    const b = outLines[li] || '';
    if (a !== b) {
      diffCount++;
      console.log(`Line ${li + 1} DIFF`);
      console.log(`  OCR: ${a.slice(0, 120)}`);
      console.log(`  OUT: ${b.slice(0, 120)}`);
    }
  }
}

module.exports = { convertSulekh };
