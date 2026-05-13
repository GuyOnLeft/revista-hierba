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
