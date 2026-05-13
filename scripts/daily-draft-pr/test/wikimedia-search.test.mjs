import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { filterCandidates } from '../wikimedia-search.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('filterCandidates accepts PD and CC-BY only', async () => {
  const raw = await readFile(join(__dirname, 'fixtures/wikimedia-imageinfo-sample.json'), 'utf8');
  const response = JSON.parse(raw);
  const candidates = filterCandidates(response);
  const titles = candidates.map(c => c.title);
  assert.ok(titles.includes('File:Pharmacy-good.jpg'), 'CC BY 4.0 should pass');
  assert.ok(!titles.includes('File:Bad-license.jpg'), 'CC BY-SA should be rejected');
});

test('filterCandidates rejects images under 800px on long edge', async () => {
  const raw = await readFile(join(__dirname, 'fixtures/wikimedia-imageinfo-sample.json'), 'utf8');
  const response = JSON.parse(raw);
  const candidates = filterCandidates(response);
  const titles = candidates.map(c => c.title);
  assert.ok(!titles.includes('File:Too-small.jpg'));
});

test('filterCandidates rejects SVG', async () => {
  const raw = await readFile(join(__dirname, 'fixtures/wikimedia-imageinfo-sample.json'), 'utf8');
  const response = JSON.parse(raw);
  const candidates = filterCandidates(response);
  const titles = candidates.map(c => c.title);
  assert.ok(!titles.includes('File:Diagram.svg'));
});

test('filterCandidates preserves artist + license for photo_credit', async () => {
  const raw = await readFile(join(__dirname, 'fixtures/wikimedia-imageinfo-sample.json'), 'utf8');
  const response = JSON.parse(raw);
  const candidates = filterCandidates(response);
  const pharmacy = candidates.find(c => c.title === 'File:Pharmacy-good.jpg');
  assert.equal(pharmacy.artist, 'Jane Doe');
  assert.equal(pharmacy.license, 'CC BY 4.0');
});
