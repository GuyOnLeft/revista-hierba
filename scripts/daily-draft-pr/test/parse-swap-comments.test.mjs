import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSwapComments } from '../parse-swap-comments.mjs';

test('parses canonical swap command', () => {
  const comments = [{ author: { login: 'jmunson' }, body: 'use #2 on article 1', createdAt: '2026-05-13T10:00:00Z' }];
  const swaps = parseSwapComments(comments);
  assert.deepEqual(swaps, [{ candidateIndex: 2, articleIndex: 1, author: 'jmunson', createdAt: '2026-05-13T10:00:00Z' }]);
});

test('case-insensitive', () => {
  const comments = [{ author: { login: 'jmunson' }, body: 'USE #3 ON ARTICLE 4', createdAt: 't' }];
  const swaps = parseSwapComments(comments);
  assert.equal(swaps.length, 1);
  assert.equal(swaps[0].candidateIndex, 3);
  assert.equal(swaps[0].articleIndex, 4);
});

test('ignores non-matching comments', () => {
  const comments = [
    { author: { login: 'x' }, body: 'lgtm', createdAt: 't' },
    { author: { login: 'x' }, body: 'please use the second one', createdAt: 't' },
    { author: { login: 'x' }, body: 'use #99 on article 1', createdAt: 't' },
  ];
  const swaps = parseSwapComments(comments);
  assert.equal(swaps.length, 0);
});

test('keeps only the latest swap per article', () => {
  const comments = [
    { author: { login: 'x' }, body: 'use #2 on article 1', createdAt: '2026-05-13T09:00:00Z' },
    { author: { login: 'x' }, body: 'use #3 on article 1', createdAt: '2026-05-13T10:00:00Z' },
    { author: { login: 'x' }, body: 'use #1 on article 2', createdAt: '2026-05-13T11:00:00Z' },
  ];
  const swaps = parseSwapComments(comments);
  assert.equal(swaps.length, 2);
  const a1 = swaps.find(s => s.articleIndex === 1);
  assert.equal(a1.candidateIndex, 3);
});
