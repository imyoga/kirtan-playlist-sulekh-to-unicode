const fs = require('fs');
const path = require('path');
const { convertSulekh } = require('./test-convert');

function normalize(s) {
  return s.replace(/\u200c/g, '').replace(/\r/g, '').replace(/\s+/g, ' ');
}

function findDiffSpans(a, b) {
  const spans = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    const startI = i;
    const startJ = j;
    while (i < a.length && j < b.length && a[i] !== b[j]) {
      if (a[i + 1] === b[j]) i++;
      else if (a[i] === b[j + 1]) j++;
      else {
        i++;
        j++;
      }
    }
    spans.push({
      ocr: a.slice(startI, i),
      out: b.slice(startJ, j),
    });
    if (spans.length > 50) break;
  }
  return spans;
}

const ocrFiles = [
  'ocr-1790791615464.txt',
  'ocr-1790791673896.txt',
  'ocr-1790791694543.txt',
  'ocr-1790791711768.txt',
];

for (let n = 1; n <= 3; n++) {
  const base = path.join(__dirname, `../sulekh-samples/${n}`);
  const sulekh = fs.readFileSync(path.join(base, `${n}.txt`), 'utf8');
  const ocr = normalize(fs.readFileSync(path.join(base, ocrFiles[n - 1]), 'utf8'));
  const out = normalize(convertSulekh(sulekh));
  const spans = findDiffSpans(ocr, out);
  console.log(`\n=== Sample ${n} unique diff spans ===`);
  const seen = new Set();
  for (const s of spans) {
    const key = s.ocr + '|' + s.out;
    if (!seen.has(key) && (s.ocr || s.out)) {
      seen.add(key);
      console.log(`  OCR: "${s.ocr}"  OUT: "${s.out}"`);
    }
  }
}
