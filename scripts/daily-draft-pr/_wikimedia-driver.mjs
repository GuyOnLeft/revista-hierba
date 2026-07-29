import { searchCommons, downloadImage } from './wikimedia-search.mjs';

const terms = (process.argv[2] || '').split('|').map(t => t.trim()).filter(Boolean);
if (terms.length === 0) {
  console.error('usage: node _wikimedia-driver.mjs "term1|term2|term3"');
  process.exit(1);
}

const candidates = await searchCommons(terms, 5);
console.log(JSON.stringify(candidates, null, 2));
