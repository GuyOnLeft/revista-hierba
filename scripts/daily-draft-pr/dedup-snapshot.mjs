import { readdir } from 'node:fs/promises';
import { extname, basename } from 'node:path';

export async function collectMergedArticleSlugs(articlesDir) {
  const entries = await readdir(articlesDir);
  return entries
    .filter(name => extname(name) === '.md')
    .map(name => basename(name, '.md'));
}

const SLUG_PATTERN = /\*\*Slug:\*\*\s+`([a-z0-9-]+)`/gi;
const DEDUP_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export function extractSlugsFromPRList(prs) {
  const cutoff = Date.now() - DEDUP_WINDOW_MS;
  const slugs = new Set();
  for (const pr of prs) {
    if (pr.state === 'CLOSED') {
      if (!pr.closedAt) continue;
      if (new Date(pr.closedAt).getTime() < cutoff) continue;
    }
    const body = pr.body || '';
    for (const match of body.matchAll(SLUG_PATTERN)) {
      slugs.add(match[1]);
    }
  }
  return [...slugs];
}

import { execFileSync } from 'node:child_process';

function fetchOpenAndRecentPRs() {
  const json = execFileSync('gh', [
    'pr', 'list',
    '--state', 'all',
    '--search', 'head:drafts/',
    '--json', 'state,closedAt,body,headRefName',
    '--limit', '60',
  ], { encoding: 'utf8' });
  return JSON.parse(json);
}

async function main() {
  const articlesDir = process.argv[2] || 'src/content/articles';
  const merged = await collectMergedArticleSlugs(articlesDir);
  const prs = fetchOpenAndRecentPRs();
  const fromPRs = extractSlugsFromPRList(prs);
  const all = [...new Set([...merged, ...fromPRs])].sort();
  console.log(JSON.stringify({ excludeSlugs: all }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
