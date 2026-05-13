import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { filterCandidates, searchCommons, downloadImage } from '../wikimedia-search.mjs';

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

test('searchCommons batches title->imageinfo and returns filtered results', async () => {
  const fixtureRaw = await readFile(join(__dirname, 'fixtures/wikimedia-imageinfo-sample.json'), 'utf8');
  let callCount = 0;
  const fakeFetch = async (url) => {
    callCount += 1;
    const u = new URL(url);
    if (u.searchParams.get('list') === 'search') {
      return {
        ok: true,
        json: async () => ({ query: { search: [{ title: 'File:Pharmacy-good.jpg' }] } }),
      };
    }
    return { ok: true, json: async () => JSON.parse(fixtureRaw) };
  };
  const results = await searchCommons(['pharmacy'], 5, fakeFetch);
  assert.ok(results.length >= 1);
  assert.equal(results[0].title, 'File:Pharmacy-good.jpg');
  assert.ok(callCount >= 2, 'should make at least one search + one imageinfo call');
});

test('downloadImage writes bytes to disk', async () => {
  const tmp = join(tmpdir(), `wm-test-${Date.now()}.bin`);
  const fakeFetch = async () => ({
    ok: true,
    arrayBuffer: async () => new TextEncoder().encode('hello').buffer,
  });
  await downloadImage('https://example.com/x.jpg', tmp, fakeFetch);
  const got = await readFile(tmp, 'utf8');
  assert.equal(got, 'hello');
  await rm(tmp);
});
