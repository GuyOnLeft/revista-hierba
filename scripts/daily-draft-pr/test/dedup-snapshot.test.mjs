import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectMergedArticleSlugs } from '../dedup-snapshot.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(__dirname, 'fixtures/articles-fixture');

test('collectMergedArticleSlugs returns slugs from .md files in a directory', async () => {
  const slugs = await collectMergedArticleSlugs(fixtureDir);
  assert.deepEqual(
    slugs.sort(),
    ['article-a-2026', 'article-b-2026', 'article-c-2026'].sort()
  );
});

test('collectMergedArticleSlugs ignores non-md files', async () => {
  const slugs = await collectMergedArticleSlugs(fixtureDir);
  assert.ok(!slugs.includes('README'));
});

import { extractSlugsFromPRList } from '../dedup-snapshot.mjs';
import { readFile } from 'node:fs/promises';

test('extractSlugsFromPRList parses slugs from PR body sections', async () => {
  const samplePath = join(__dirname, 'fixtures/gh-pr-list-sample.json');
  const raw = await readFile(samplePath, 'utf8');
  const prs = JSON.parse(raw);
  const slugs = extractSlugsFromPRList(prs);
  assert.deepEqual(
    slugs.sort(),
    ['draft-slug-1', 'draft-slug-2', 'draft-slug-3'].sort()
  );
});

test('extractSlugsFromPRList filters PRs older than 30 days', async () => {
  const fortyDaysAgo = new Date(Date.now() - 40 * 86400_000).toISOString();
  const recent = new Date(Date.now() - 5 * 86400_000).toISOString();
  const prs = [
    { body: '**Slug:** `old-slug`', closedAt: fortyDaysAgo, state: 'CLOSED' },
    { body: '**Slug:** `recent-slug`', closedAt: recent, state: 'CLOSED' },
    { body: '**Slug:** `open-slug`', closedAt: null, state: 'OPEN' },
  ];
  const slugs = extractSlugsFromPRList(prs);
  assert.deepEqual(slugs.sort(), ['open-slug', 'recent-slug'].sort());
});
