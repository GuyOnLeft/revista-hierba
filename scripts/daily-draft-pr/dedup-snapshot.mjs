import { readdir } from 'node:fs/promises';
import { extname, basename } from 'node:path';

export async function collectMergedArticleSlugs(articlesDir) {
  const entries = await readdir(articlesDir);
  return entries
    .filter(name => extname(name) === '.md')
    .map(name => basename(name, '.md'));
}
