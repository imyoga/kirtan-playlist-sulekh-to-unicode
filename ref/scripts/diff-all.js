const fs = require('fs');
const path = require('path');
const { convertSulekh } = require('./test-convert');

function normalizeForCompare(s) {
  return s.replace(/\u200c/g, '').replace(/\r/g, '').replace(/\s+/g, ' ').trim();
}

const ocrFiles = [
  'ocr-1790791615464.txt',
  'ocr-1790791673896.txt',
  'ocr-1790791694543.txt',
  'ocr-1790791711768.txt',
];

for (let n = 1; n <= 4; n++) {
  const base = path.join(__dirname, `../sulekh-samples/${n}`);
  const sulekh = fs.readFileSync(path.join(base, `${n}.txt`), 'utf8');
  const ocr = fs.readFileSync(path.join(base, ocrFiles[n - 1]), 'utf8');
  const out = convertSulekh(sulekh);
  const ocrLines = normalizeForCompare(ocr).split('\n').filter(Boolean);
  const outLines = normalizeForCompare(out).split('\n').filter(Boolean);
  let diffs = 0;
  console.log(`\n=== Sample ${n} ===`);
  const max = Math.max(ocrLines.length, outLines.length);
  for (let li = 0; li < max; li++) {
    const a = ocrLines[li] || '';
    const b = outLines[li] || '';
    if (a !== b) {
      diffs++;
      console.log(`L${li + 1}:`);
      console.log(`  OCR (${a.length}): ${a}`);
      console.log(`  OUT (${b.length}): ${b}`);
    }
  }
  if (diffs === 0) console.log('All lines match!');
  else console.log(`Total differing lines: ${diffs}`);
}
