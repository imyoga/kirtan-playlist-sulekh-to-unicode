import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sulekhToUnicode } from '../src/converter/sulekhToUnicode.js';
import { detectScriptType } from '../src/converter/detect.js';
import { itemTitleFromText } from '../src/utils/itemTitle.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplesRoot = path.join(__dirname, '../ref/sulekh-samples');

function normalizeForCompare(s) {
  return s.replace(/\u200c/g, '').replace(/\r/g, '').replace(/\s+/g, ' ').trim();
}

const ocrFiles = [
  'ocr-1790791615464.txt',
  'ocr-1790791673896.txt',
  'ocr-1790791694543.txt',
  'ocr-1790791711768.txt',
];

describe('converter', () => {
  for (let n = 1; n <= 4; n++) {
    it(`sample ${n} sulekh converts close to OCR reference`, () => {
      const base = path.join(samplesRoot, String(n));
      const sulekh = fs.readFileSync(path.join(base, `${n}.txt`), 'utf8');
      const ocr = fs.readFileSync(path.join(base, ocrFiles[n - 1]), 'utf8');
      const out = sulekhToUnicode(sulekh);
      const a = normalizeForCompare(ocr);
      const b = normalizeForCompare(out);
      assert.ok(b.length > 10);
      assert.ok(a.length > 10);
      const ratio = b.length / a.length;
      assert.ok(ratio > 0.85 && ratio < 1.15, `length ratio ${ratio}`);
    });
  }

  it('detects sulekh vs unicode', () => {
    assert.equal(detectScriptType('áâë áë'), 'sulekh');
    assert.equal(detectScriptType('શ્રી હરિ'), 'unicode');
  });
});

describe('itemTitleFromText', () => {
  it('truncates to seven words', () => {
    const t = itemTitleFromText('one two three four five six seven eight nine');
    assert.equal(t, 'one two three four five six seven…');
  });
});
