# Daily Draft PR Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an autonomous daily agent that opens a GitHub PR each morning with 4 bilingual article drafts + 3 Wikimedia image candidates per article for Revista Hierba.

**Architecture:** A `/schedule`-registered remote Claude agent fires daily at 02:00 Denver and invokes a new `/daily-draft-pr` slash command. The slash command orchestrates research and drafting (LLM-creative work) and delegates deterministic work (dedup snapshot, Wikimedia search + license filter, PR body rendering, swap-comment parsing) to small Node helper scripts under `scripts/daily-draft-pr/`. Helper scripts are unit-tested with `node:test`; the slash command is validated by first-week monitored runs and a `--dry-run` mode.

**Tech Stack:** Astro 4 (existing), Node 20+, `node:test` built-in test runner (no new devDeps), `gh` CLI, `git`, Wikimedia Commons MediaWiki API, Gmail MCP (for Phase 8 send), `/schedule` skill (for cron).

**Spec:** `docs/superpowers/specs/2026-05-13-daily-draft-pr-agent-design.md`

---

## File Structure

**Create:**
- `scripts/daily-draft-pr/dedup-snapshot.mjs` — Reads `src/content/articles/` + open/recent daily-draft PRs, emits exclusion list as JSON.
- `scripts/daily-draft-pr/wikimedia-search.mjs` — Queries Wikimedia Commons API for image candidates, filters by license + size, downloads top 3 to a working dir.
- `scripts/daily-draft-pr/render-pr-body.mjs` — Renders the PR body markdown from a JSON article manifest.
- `scripts/daily-draft-pr/parse-swap-comments.mjs` — Parses `gh pr view --comments` output for `use #N on article M` swap commands.
- `scripts/daily-draft-pr/test/dedup-snapshot.test.mjs`
- `scripts/daily-draft-pr/test/wikimedia-search.test.mjs`
- `scripts/daily-draft-pr/test/render-pr-body.test.mjs`
- `scripts/daily-draft-pr/test/parse-swap-comments.test.mjs`
- `scripts/daily-draft-pr/test/fixtures/` — Wikimedia API response fixtures, sample PR comment payloads.
- `.claude/commands/daily-draft-pr.md` — The slash command itself (markdown spec, LLM-executed).

**Modify:**
- `package.json` — Add `"test:scripts": "node --test scripts/daily-draft-pr/test/**/*.test.mjs"` to scripts section.

**Untouched:**
- `.claude/commands/draft-articles.md` — Existing manual flow stays intact.
- `src/content/config.ts` — Schema unchanged; new articles conform to existing fields.
- Astro pipeline, Netlify config, all site source.

---

## Task 1: Scaffold scripts directory and add test runner script

**Files:**
- Create: `scripts/daily-draft-pr/.gitkeep`
- Create: `scripts/daily-draft-pr/test/.gitkeep`
- Create: `scripts/daily-draft-pr/test/fixtures/.gitkeep`
- Modify: `package.json`

- [ ] **Step 1: Create directory skeleton**

```bash
mkdir -p scripts/daily-draft-pr/test/fixtures
touch scripts/daily-draft-pr/.gitkeep
touch scripts/daily-draft-pr/test/.gitkeep
touch scripts/daily-draft-pr/test/fixtures/.gitkeep
```

- [ ] **Step 2: Add test script to package.json**

In `package.json`, modify the `"scripts"` block to include:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "playwright test",
    "test:scripts": "node --test scripts/daily-draft-pr/test/**/*.test.mjs"
  }
}
```

- [ ] **Step 3: Verify the test runner works on the empty tree**

Run: `npm run test:scripts`
Expected: exits 0 with "tests 0" or similar — proves the runner is wired correctly even with no tests yet.

- [ ] **Step 4: Commit**

```bash
git add scripts/daily-draft-pr package.json
git commit -m "scaffold: daily-draft-pr scripts dir + node:test runner

[skip ci]"
```

---

## Task 2: Dedup snapshot — read merged articles

**Files:**
- Create: `scripts/daily-draft-pr/dedup-snapshot.mjs`
- Create: `scripts/daily-draft-pr/test/dedup-snapshot.test.mjs`
- Create: `scripts/daily-draft-pr/test/fixtures/articles-fixture/` (with 3 sample article .md files)

- [ ] **Step 1: Write the failing test**

Create `scripts/daily-draft-pr/test/dedup-snapshot.test.mjs`:

```javascript
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
```

Create the fixture files:

```bash
mkdir -p scripts/daily-draft-pr/test/fixtures/articles-fixture
cat > scripts/daily-draft-pr/test/fixtures/articles-fixture/article-a-2026.md <<'EOF'
---
title: A
date: 2026-04-01
---
body
EOF
cat > scripts/daily-draft-pr/test/fixtures/articles-fixture/article-b-2026.md <<'EOF'
---
title: B
date: 2026-04-15
---
body
EOF
cat > scripts/daily-draft-pr/test/fixtures/articles-fixture/article-c-2026.md <<'EOF'
---
title: C
date: 2026-05-01
---
body
EOF
echo "not an article" > scripts/daily-draft-pr/test/fixtures/articles-fixture/README
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:scripts`
Expected: FAIL with "Cannot find module ... dedup-snapshot.mjs" or "collectMergedArticleSlugs is not defined".

- [ ] **Step 3: Implement collectMergedArticleSlugs**

Create `scripts/daily-draft-pr/dedup-snapshot.mjs`:

```javascript
import { readdir } from 'node:fs/promises';
import { extname, basename } from 'node:path';

export async function collectMergedArticleSlugs(articlesDir) {
  const entries = await readdir(articlesDir);
  return entries
    .filter(name => extname(name) === '.md')
    .map(name => basename(name, '.md'));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:scripts`
Expected: 2/2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/daily-draft-pr/dedup-snapshot.mjs scripts/daily-draft-pr/test/
git commit -m "feat(dedup): collect slugs from merged articles dir

[skip ci]"
```

---

## Task 3: Dedup snapshot — read open + recent PR branches

**Files:**
- Modify: `scripts/daily-draft-pr/dedup-snapshot.mjs`
- Modify: `scripts/daily-draft-pr/test/dedup-snapshot.test.mjs`
- Create: `scripts/daily-draft-pr/test/fixtures/gh-pr-list-sample.json`

- [ ] **Step 1: Write the failing test**

Add to `scripts/daily-draft-pr/test/dedup-snapshot.test.mjs`:

```javascript
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
```

Create the fixture `scripts/daily-draft-pr/test/fixtures/gh-pr-list-sample.json`:

```json
[
  {
    "state": "OPEN",
    "closedAt": null,
    "body": "# Daily drafts\n\n## 1. cannabis\n**Slug:** `draft-slug-1`\n\n## 2. plantas\n**Slug:** `draft-slug-2`"
  },
  {
    "state": "CLOSED",
    "closedAt": "REPLACE_WITH_RECENT_ISO",
    "body": "## 1. derechos\n**Slug:** `draft-slug-3`"
  }
]
```

After creating, replace the placeholder closedAt with a recent timestamp using:

```bash
RECENT=$(node -e "console.log(new Date(Date.now() - 5*86400000).toISOString())")
sed -i.bak "s|REPLACE_WITH_RECENT_ISO|${RECENT}|" scripts/daily-draft-pr/test/fixtures/gh-pr-list-sample.json
rm scripts/daily-draft-pr/test/fixtures/gh-pr-list-sample.json.bak
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:scripts`
Expected: FAIL — `extractSlugsFromPRList is not a function`.

- [ ] **Step 3: Implement extractSlugsFromPRList**

Append to `scripts/daily-draft-pr/dedup-snapshot.mjs`:

```javascript
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
```

- [ ] **Step 4: Run tests**

Run: `npm run test:scripts`
Expected: 4/4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/daily-draft-pr/
git commit -m "feat(dedup): extract slugs from open + recent-closed PRs

[skip ci]"
```

---

## Task 4: Dedup snapshot — CLI entry point

**Files:**
- Modify: `scripts/daily-draft-pr/dedup-snapshot.mjs`

- [ ] **Step 1: Add CLI orchestration to the module**

Append to `scripts/daily-draft-pr/dedup-snapshot.mjs`:

```javascript
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
```

- [ ] **Step 2: Smoke-test the CLI locally**

Run: `node scripts/daily-draft-pr/dedup-snapshot.mjs src/content/articles`
Expected: JSON output with `excludeSlugs` array containing all current article slugs (and any open daily-draft PR slugs if any exist).

- [ ] **Step 3: Commit**

```bash
git add scripts/daily-draft-pr/dedup-snapshot.mjs
git commit -m "feat(dedup): CLI entry point for dedup snapshot

[skip ci]"
```

---

## Task 5: Wikimedia image search — license + size filter

**Files:**
- Create: `scripts/daily-draft-pr/wikimedia-search.mjs`
- Create: `scripts/daily-draft-pr/test/wikimedia-search.test.mjs`
- Create: `scripts/daily-draft-pr/test/fixtures/wikimedia-imageinfo-sample.json`

- [ ] **Step 1: Create the fixture**

Create `scripts/daily-draft-pr/test/fixtures/wikimedia-imageinfo-sample.json`:

```json
{
  "query": {
    "pages": {
      "1": {
        "title": "File:Pharmacy-good.jpg",
        "imageinfo": [{
          "width": 1600, "height": 1200, "mime": "image/jpeg",
          "extmetadata": {
            "LicenseShortName": { "value": "CC BY 4.0" },
            "Artist": { "value": "Jane Doe" },
            "ImageDescription": { "value": "A pharmacy interior" }
          },
          "url": "https://upload.wikimedia.org/wikipedia/commons/1/11/Pharmacy-good.jpg"
        }]
      },
      "2": {
        "title": "File:Bad-license.jpg",
        "imageinfo": [{
          "width": 1200, "height": 800, "mime": "image/jpeg",
          "extmetadata": {
            "LicenseShortName": { "value": "CC BY-SA 3.0" },
            "Artist": { "value": "X" }
          },
          "url": "https://example.com/bad.jpg"
        }]
      },
      "3": {
        "title": "File:Too-small.jpg",
        "imageinfo": [{
          "width": 400, "height": 300, "mime": "image/jpeg",
          "extmetadata": {
            "LicenseShortName": { "value": "Public domain" },
            "Artist": { "value": "Y" }
          },
          "url": "https://example.com/small.jpg"
        }]
      },
      "4": {
        "title": "File:Diagram.svg",
        "imageinfo": [{
          "width": 2000, "height": 2000, "mime": "image/svg+xml",
          "extmetadata": {
            "LicenseShortName": { "value": "CC BY 4.0" },
            "Artist": { "value": "Z" }
          },
          "url": "https://example.com/diagram.svg"
        }]
      }
    }
  }
}
```

- [ ] **Step 2: Write the failing test**

Create `scripts/daily-draft-pr/test/wikimedia-search.test.mjs`:

```javascript
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
```

- [ ] **Step 3: Run tests to confirm failure**

Run: `npm run test:scripts`
Expected: FAIL — `filterCandidates` not defined.

- [ ] **Step 4: Implement filterCandidates**

Create `scripts/daily-draft-pr/wikimedia-search.mjs`:

```javascript
const ACCEPTABLE_LICENSE_PATTERNS = [
  /^public domain/i,
  /^cc\s*0/i,
  /^cc\s*by\s+\d/i,
];

const MIN_LONG_EDGE = 800;
const REJECT_MIMES = new Set(['image/svg+xml']);

function isAcceptableLicense(licenseStr) {
  if (!licenseStr) return false;
  return ACCEPTABLE_LICENSE_PATTERNS.some(rx => rx.test(licenseStr));
}

export function filterCandidates(apiResponse) {
  const pages = apiResponse?.query?.pages || {};
  const results = [];
  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    if (REJECT_MIMES.has(info.mime)) continue;
    const longEdge = Math.max(info.width || 0, info.height || 0);
    if (longEdge < MIN_LONG_EDGE) continue;
    const license = info.extmetadata?.LicenseShortName?.value;
    if (!isAcceptableLicense(license)) continue;
    results.push({
      title: page.title,
      url: info.url,
      width: info.width,
      height: info.height,
      mime: info.mime,
      license,
      artist: info.extmetadata?.Artist?.value || 'Unknown',
      description: info.extmetadata?.ImageDescription?.value || '',
    });
  }
  return results;
}
```

- [ ] **Step 5: Run tests to confirm pass**

Run: `npm run test:scripts`
Expected: all 4 wikimedia tests pass.

- [ ] **Step 6: Commit**

```bash
git add scripts/daily-draft-pr/wikimedia-search.mjs scripts/daily-draft-pr/test/wikimedia-search.test.mjs scripts/daily-draft-pr/test/fixtures/wikimedia-imageinfo-sample.json
git commit -m "feat(wikimedia): license + size + mime filter for candidates

[skip ci]"
```

---

## Task 6: Wikimedia image search — query + download

**Files:**
- Modify: `scripts/daily-draft-pr/wikimedia-search.mjs`

- [ ] **Step 1: Add query helper**

Append to `scripts/daily-draft-pr/wikimedia-search.mjs`:

```javascript
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

export async function searchCommons(terms, perTermLimit = 5, fetchImpl = fetch) {
  const fileTitles = new Set();
  for (const term of terms) {
    const url = new URL(COMMONS_API);
    url.searchParams.set('action', 'query');
    url.searchParams.set('format', 'json');
    url.searchParams.set('list', 'search');
    url.searchParams.set('srnamespace', '6');
    url.searchParams.set('srsearch', term);
    url.searchParams.set('srlimit', String(perTermLimit));
    const resp = await fetchImpl(url, {
      headers: { 'User-Agent': 'RevistaHierba-DailyDraft/1.0 (https://revistahierba.com)' },
    });
    if (!resp.ok) continue;
    const data = await resp.json();
    for (const hit of data.query?.search || []) {
      fileTitles.add(hit.title);
    }
  }
  if (fileTitles.size === 0) return [];

  const titlesParam = [...fileTitles].join('|');
  const infoUrl = new URL(COMMONS_API);
  infoUrl.searchParams.set('action', 'query');
  infoUrl.searchParams.set('format', 'json');
  infoUrl.searchParams.set('titles', titlesParam);
  infoUrl.searchParams.set('prop', 'imageinfo');
  infoUrl.searchParams.set('iiprop', 'url|size|mime|extmetadata');
  const infoResp = await fetchImpl(infoUrl, {
    headers: { 'User-Agent': 'RevistaHierba-DailyDraft/1.0 (https://revistahierba.com)' },
  });
  const info = await infoResp.json();
  return filterCandidates(info);
}
```

- [ ] **Step 2: Add a fetch-stubbed integration test**

Append to `scripts/daily-draft-pr/test/wikimedia-search.test.mjs`:

```javascript
import { searchCommons } from '../wikimedia-search.mjs';

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
```

- [ ] **Step 3: Run tests**

Run: `npm run test:scripts`
Expected: all wikimedia tests pass (5 total).

- [ ] **Step 4: Add download helper**

Append to `scripts/daily-draft-pr/wikimedia-search.mjs`:

```javascript
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';

export async function downloadImage(url, destPath, fetchImpl = fetch) {
  await mkdir(dirname(destPath), { recursive: true });
  const resp = await fetchImpl(url, {
    headers: { 'User-Agent': 'RevistaHierba-DailyDraft/1.0 (https://revistahierba.com)' },
  });
  if (!resp.ok) throw new Error(`Download failed: ${resp.status} ${url}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  await writeFile(destPath, buf);
  return destPath;
}
```

- [ ] **Step 5: Add download test**

Append to `scripts/daily-draft-pr/test/wikimedia-search.test.mjs`:

```javascript
import { downloadImage } from '../wikimedia-search.mjs';
import { readFile as readFile2, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

test('downloadImage writes bytes to disk', async () => {
  const tmp = join(tmpdir(), `wm-test-${Date.now()}.bin`);
  const fakeFetch = async () => ({
    ok: true,
    arrayBuffer: async () => new TextEncoder().encode('hello').buffer,
  });
  await downloadImage('https://example.com/x.jpg', tmp, fakeFetch);
  const got = await readFile2(tmp, 'utf8');
  assert.equal(got, 'hello');
  await rm(tmp);
});
```

- [ ] **Step 6: Run tests**

Run: `npm run test:scripts`
Expected: all wikimedia tests pass (6 total).

- [ ] **Step 7: Commit**

```bash
git add scripts/daily-draft-pr/
git commit -m "feat(wikimedia): searchCommons + downloadImage with fetch injection

[skip ci]"
```

---

## Task 7: PR body renderer

**Files:**
- Create: `scripts/daily-draft-pr/render-pr-body.mjs`
- Create: `scripts/daily-draft-pr/test/render-pr-body.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/daily-draft-pr/test/render-pr-body.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPRBody } from '../render-pr-body.mjs';

const sampleManifest = {
  date: '2026-05-13',
  deployPreviewUrl: 'https://deploy-preview-42--revistahierba.netlify.app',
  excludedSlugs: ['old-slug-1', 'old-slug-2'],
  articles: [
    {
      section: 'cannabis',
      title: 'REPROCANN: 80.000 expedientes atrapados',
      slug: 'reprocann-80k-expedientes-2026',
      leadKind: 'local',
      sources: ['Info Noticias Olavarría', 'Ando Volao LATAM'],
      excerpt: 'Desde febrero de 2026, SEDRONAR aprueba en 24 horas — pero solo si...',
      imageCandidates: [
        { url: 'https://commons.wikimedia.org/c1.jpg', subject: 'Cannabis plant', license: 'CC BY 4.0', committed: true },
        { url: 'https://commons.wikimedia.org/c2.jpg', subject: 'Pharmacy', license: 'CC BY 4.0', committed: false },
        { url: 'https://commons.wikimedia.org/c3.jpg', subject: 'ANMAT building', license: 'Public domain', committed: false },
      ],
    },
  ],
  skippedSections: ['plantas'],
};

test('renderPRBody includes the deploy preview URL', () => {
  const body = renderPRBody(sampleManifest);
  assert.match(body, /deploy-preview-42--revistahierba\.netlify\.app/);
});

test('renderPRBody numbers articles sequentially with a gap for skipped sections', () => {
  const body = renderPRBody(sampleManifest);
  assert.match(body, /## 1\. `cannabis`/);
  assert.match(body, /⚠️ No qualifying story for plantas/);
});

test('renderPRBody marks the committed image candidate', () => {
  const body = renderPRBody(sampleManifest);
  assert.match(body, /committed pick: #1/);
});

test('renderPRBody embeds the swap instruction', () => {
  const body = renderPRBody(sampleManifest);
  assert.match(body, /use #2 on article 1/);
});

test('renderPRBody lists excluded slugs at the bottom', () => {
  const body = renderPRBody(sampleManifest);
  assert.match(body, /old-slug-1/);
  assert.match(body, /old-slug-2/);
});
```

- [ ] **Step 2: Run test — confirm failure**

Run: `npm run test:scripts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement renderPRBody**

Create `scripts/daily-draft-pr/render-pr-body.mjs`:

```javascript
const SECTION_ORDER = ['cannabis', 'plantas', 'ciencia', 'derechos'];

function renderArticleSection(article, index) {
  const leadLabel = article.leadKind === 'local' ? 'Local lead' : `Widened to ${article.leadKind}`;
  const candidates = article.imageCandidates;
  const committedIdx = candidates.findIndex(c => c.committed);
  const committedLabel = committedIdx >= 0 ? `committed pick: #${committedIdx + 1}` : 'no image committed';
  const headers = candidates.map((c, i) => i === committedIdx ? `#${i + 1} ✅ committed` : `#${i + 1}`);
  const thumbs = candidates.map(c => `![](${c.url})`);
  const captions = candidates.map(c => `${c.subject}, [Wikimedia](${c.url}) ${c.license}`);

  return [
    `## ${index}. \`${article.section}\` — ${article.title}`,
    `**Slug:** \`${article.slug}\`  `,
    `**${leadLabel}** · Sources: ${article.sources.join(', ')}  `,
    `**Excerpt:** ${article.excerpt}`,
    '',
    `**Image candidates** (${committedLabel})`,
    `| ${headers.join(' | ')} |`,
    `|${headers.map(() => '---').join('|')}|`,
    `| ${thumbs.join(' | ')} |`,
    `| ${captions.join(' | ')} |`,
    '',
    `To swap: comment \`use #2 on article ${index}\``,
    '',
    '---',
    '',
  ].join('\n');
}

export function renderPRBody(manifest) {
  const parts = [];
  parts.push(`# Daily drafts — ${manifest.date}`);
  parts.push('');
  parts.push(`**Deploy preview:** ${manifest.deployPreviewUrl}  `);
  parts.push(`**Dedup window:** 30 days · ${manifest.excludedSlugs.length} topics excluded ([list](#dedup))`);
  parts.push('');
  parts.push('---');
  parts.push('');

  let visibleIndex = 0;
  for (const section of SECTION_ORDER) {
    const article = manifest.articles.find(a => a.section === section);
    if (article) {
      visibleIndex += 1;
      parts.push(renderArticleSection(article, visibleIndex));
    } else if (manifest.skippedSections.includes(section)) {
      parts.push(`## \`${section}\` — ⚠️ No qualifying story for ${section}`);
      parts.push('');
      parts.push('---');
      parts.push('');
    }
  }

  parts.push('<a name="dedup"></a>');
  parts.push('## Dedup excluded');
  for (const slug of manifest.excludedSlugs) {
    parts.push(`- \`${slug}\``);
  }
  return parts.join('\n');
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test:scripts`
Expected: all 5 render-pr-body tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/daily-draft-pr/render-pr-body.mjs scripts/daily-draft-pr/test/render-pr-body.test.mjs
git commit -m "feat(pr-body): render daily draft PR body from manifest

[skip ci]"
```

---

## Task 8: Swap-comment parser

**Files:**
- Create: `scripts/daily-draft-pr/parse-swap-comments.mjs`
- Create: `scripts/daily-draft-pr/test/parse-swap-comments.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/daily-draft-pr/test/parse-swap-comments.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run — confirm fail**

Run: `npm run test:scripts`
Expected: FAIL.

- [ ] **Step 3: Implement parseSwapComments**

Create `scripts/daily-draft-pr/parse-swap-comments.mjs`:

```javascript
const SWAP_PATTERN = /^\s*use\s+#([123])\s+on\s+article\s+([1-4])\s*$/i;

export function parseSwapComments(comments) {
  const byArticle = new Map();
  for (const comment of comments) {
    const lines = (comment.body || '').split('\n');
    for (const line of lines) {
      const match = line.match(SWAP_PATTERN);
      if (!match) continue;
      const candidateIndex = Number(match[1]);
      const articleIndex = Number(match[2]);
      const entry = {
        candidateIndex,
        articleIndex,
        author: comment.author?.login || 'unknown',
        createdAt: comment.createdAt,
      };
      const existing = byArticle.get(articleIndex);
      if (!existing || new Date(entry.createdAt) > new Date(existing.createdAt)) {
        byArticle.set(articleIndex, entry);
      }
    }
  }
  return [...byArticle.values()];
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test:scripts`
Expected: all 4 swap-comment tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/daily-draft-pr/parse-swap-comments.mjs scripts/daily-draft-pr/test/parse-swap-comments.test.mjs
git commit -m "feat(swap): parse \"use #N on article M\" PR comments

[skip ci]"
```

---

## Task 9: Write the `/daily-draft-pr` slash command

**Files:**
- Create: `.claude/commands/daily-draft-pr.md`

- [ ] **Step 1: Write the slash command**

Create `.claude/commands/daily-draft-pr.md`:

````markdown
# /daily-draft-pr

Autonomous daily draft pipeline for Revista Hierba. Produces a GitHub PR with 4 bilingual article drafts + 3 Wikimedia image candidates per article. Coexists with `/draft-articles` (manual Victoria-PDF flow); this command is the cron-driven path with PR-as-approval-gate.

**Authoritative spec:** `docs/superpowers/specs/2026-05-13-daily-draft-pr-agent-design.md`
**Selection rule memory:** `feedback_revista_hierba_geographic_scope` (reader-first, local-tiebreaker, two overrides)
**Section scopes + non-negotiables memory:** `feedback_revista_hierba_workflow`

## Flags

- `--dry-run` — Execute phases 1–6 (research + write + build) but skip Phase 7 (PR open) and Phase 8 (email). Leaves the branch on disk for inspection.
- `--process-swaps-only` — Skip new-content phases. Only read open daily-draft PRs for unprocessed swap comments and apply them.

## Phase 1 — Setup

1. `cd ~/revista-hierba`
2. `git checkout main && git pull origin main`
3. `BRANCH="drafts/$(date +%Y-%m-%d)"`
4. If `git rev-parse --verify "$BRANCH" 2>/dev/null`: abort with message "branch already exists; today's run skipped"
5. `git checkout -b "$BRANCH"`

## Phase 2 — Dedup snapshot

Run: `node scripts/daily-draft-pr/dedup-snapshot.mjs > /tmp/dedup-$(date +%Y-%m-%d).json`

The output JSON has shape `{ excludeSlugs: ["slug1", "slug2", ...] }`. Hold this list in working memory; reject any candidate topic whose proposed slug or whose subject substantively matches an excluded slug.

Also: read open daily-draft PRs once via `gh pr list --label daily-draft --state open --json number,headRefName,comments`. For each, collect comments and pass them to `node scripts/daily-draft-pr/parse-swap-comments.mjs` (when implemented as a CLI in a later iteration; for now, inline the parsing logic from the module). If swaps exist for an *open* PR (not today's), apply them on that PR's branch with `git checkout`, image re-download, commit, `git push`, then return to today's branch.

## Phase 3 — Research

Apply the reader-first + local-tiebreaker rule. Per section, in order:
1. Local pass — search Spanish-language sources from the curated list in `.claude/commands/draft-articles.md`.
2. Readability check — would a reader open this? If yes and local, lock it in.
3. Widen if needed — regional → global.
4. World-event override — if a global story is genuinely noteworthy, take it even when local has content.

Skip a section honestly if no qualifying story exists after widening. Record the skip; do not pad.

## Phase 4 — Drafts

Per non-skipped section:
- English draft, ~1100–1400 words, `## Sources` end-list, no inline hyperlinks.
- Immediate Spanish translation, `## Fuentes`, LatAm register.
- Slug = kebab-case from Spanish title, suffixed with `-YYYY` if needed for disambiguation.

## Phase 5 — Image search

Per article:
1. Extract 3–5 high-signal nouns from the article via an inline reasoning step.
2. Run: `node scripts/daily-draft-pr/wikimedia-search.mjs <nouns separated by |> > /tmp/img-<slug>.json` (CLI to be added in a later task if needed; for now, invoke the JS module directly from a small driver script or via `node -e`).
3. Score the returned candidates by semantic match to the article (LLM reasoning step). Pick top 3.
4. Download the top-1 candidate to `public/images/articles/<slug>.<ext>` using the `downloadImage` helper.
5. Record all 3 candidates (URLs, subjects, licenses, artists) in the article manifest for PR body rendering.
6. If fewer than 3 survive filtering, set `needs-image-review` flag on the article.

## Phase 6 — Write files + commit

Per article:
1. Write ES file to `src/content/articles/<slug>.md` with full frontmatter per `src/content/config.ts`.
2. Write EN file to `src/content/articles-en/<slug>.md` with reduced frontmatter.
3. Set `photo_credit:` = `Foto: <Artist> / Wikimedia Commons (<LicenseShortName>)`.
4. After all articles written: run `npm run build`. If it fails, abort to Phase 7-failure path (open issue, do not open PR).
5. One commit per article. Message: `<section>: <slug>`. Each commit includes the ES file + EN file + image.

## Phase 7 — Open PR

1. Build the manifest JSON (date, deploy-preview URL placeholder, articles with their image candidates, skipped sections, excluded slugs).
2. Get deploy preview URL: after `git push origin "$BRANCH"`, GitHub triggers the Netlify integration which posts the deploy-preview URL as a check. Poll `gh pr checks` until the preview URL appears, or simply construct the predicted URL pattern `https://deploy-preview-<N>--revistahierba.netlify.app` after the PR is created (N comes from `gh pr create` output).
3. Render PR body: `node scripts/daily-draft-pr/render-pr-body.mjs < manifest.json > pr-body.md`. (CLI to be added; if not yet present, import the module inline.)
4. `gh pr create --base main --head "$BRANCH" --title "Daily drafts — $(date +%Y-%m-%d)" --label daily-draft --body-file pr-body.md`
5. If any article triggered the image fallback, also: `gh pr edit <num> --add-label needs-image-review`.

## Phase 8 — Email Victoria

Use the Gmail MCP `send` action (not `create_draft` — full send, no attachments needed):
- To: `arayaflorenciavictoria@gmail.com`
- CC: `jmunson0711@gmail.com`
- Subject: `Revista Hierba — Borradores del día · <fecha en español>`
- Body (Spanish):
  > Hola Victoria,
  >
  > Te paso el link de la vista previa de los borradores del día. Para tu información — Jeremy aprueba antes de publicar.
  >
  > Vista previa: <deploy-preview-url>
  >
  > Secciones de hoy:
  > • cannabis — <título>
  > • plantas — <título o "sin nota hoy">
  > • ciencia — <título>
  > • derechos — <título>
  >
  > Cualquier comentario, escribime cuando puedas.
  >
  > Un abrazo,
  > Jeremy

Failure to send is non-fatal: log to the just-opened PR as a comment, continue.

## Failure modes

| Failure | Behavior |
|---|---|
| Branch already exists | Abort Phase 1 cleanly. |
| No qualifying story for a section | Skip silently; PR body flags it. 3-article PR is valid. |
| `npm run build` fails | Open issue titled `Daily draft build failure — YYYY-MM-DD`; skip 7+8. |
| Wikimedia returns < 3 usable images | Commit best available; label `needs-image-review`. |
| `gh pr create` fails | Retry once after 30s; then open issue. |
| Gmail send fails | Comment on the PR; continue. |
````

- [ ] **Step 2: Commit**

```bash
git add .claude/commands/daily-draft-pr.md
git commit -m "feat: /daily-draft-pr slash command spec

[skip ci]"
```

---

## Task 10: Dry-run validation

**Files:** none modified — validation only.

- [ ] **Step 1: Run the command in dry-run mode**

In a fresh Claude Code session at `~/revista-hierba`:

```
/daily-draft-pr --dry-run
```

Expected behavior:
- A `drafts/YYYY-MM-DD` branch is created locally.
- 4 (or 3) ES files appear in `src/content/articles/`.
- 4 (or 3) EN files appear in `src/content/articles-en/`.
- Per-article images appear in `public/images/articles/<slug>.<ext>`.
- `npm run build` completes successfully.
- No PR is opened.
- No email is sent.

- [ ] **Step 2: Manual inspection checklist**

Verify on the dry-run branch:
- [ ] Article frontmatter validates against `src/content/config.ts` (run `npm run build` — Astro will fail loudly if not).
- [ ] Images are real, not placeholders, for at least 3 of 4 articles.
- [ ] Photo credit field is populated and matches Wikimedia attribution.
- [ ] Sources lists are populated and credible.
- [ ] No topic in the new articles overlaps with anything in the dedup snapshot.
- [ ] Section scopes are respected (no off-mission articles).

- [ ] **Step 3: Clean up**

```bash
git checkout main
git branch -D drafts/$(date +%Y-%m-%d)
rm -rf public/images/articles/<slug>.{jpg,png}  # only the dry-run images
```

- [ ] **Step 4: Document any drift**

If the dry-run output deviates from spec, write findings to `docs/superpowers/plans/2026-05-13-daily-draft-pr-agent-dry-run-notes.md` and iterate on `.claude/commands/daily-draft-pr.md` before turning on the schedule.

---

## Task 11: Register the daily `/schedule` routine

**Files:** none in the repo — `/schedule` state is in Anthropic's remote-agent runtime.

- [ ] **Step 1: Invoke /schedule from a fresh Claude Code session**

In `~/revista-hierba`, run the `/schedule` skill with arguments equivalent to:

```
/schedule create
  name: revista-hierba-daily-draft
  cron: 0 2 * * *
  timezone: America/Denver
  command: /daily-draft-pr
  working-directory: ~/revista-hierba
```

(Exact invocation flags depend on the `/schedule` skill's current API — let the skill prompt for any missing fields.)

- [ ] **Step 2: Confirm registration**

```
/schedule list
```

Expected: a row for `revista-hierba-daily-draft` with next-fire timestamp showing tomorrow at 02:00 Denver.

- [ ] **Step 3: Smoke-test with an immediate one-off run**

```
/schedule run revista-hierba-daily-draft --once
```

(If `/schedule` supports an immediate one-off trigger; otherwise let the natural cron fire tomorrow.)

Expected: a PR opens within ~10 minutes, Netlify deploy preview builds within ~3 minutes after that.

---

## Task 12: First-week monitoring + memory update

**Files:**
- Modify: `~/.claude/projects/-Users-jeremymunson/memory/feedback_revista_hierba_workflow.md`

- [ ] **Step 1: Update workflow memory**

Modify `feedback_revista_hierba_workflow.md` to add a section at the top:

```markdown
## Two paths now coexist (2026-05-13)

- **Daily autonomous path:** `/daily-draft-pr` runs at 02:00 Denver via `/schedule`. Opens a PR with 4 bilingual drafts + 3 Wikimedia image candidates per article. Jeremy reviews + merges. Victoria gets a courtesy email (informational, not gating).
- **Manual on-demand path:** `/draft-articles` (the original Victoria-PDF flow described below) still works for special editorial pushes where Victoria-as-approver is wanted.

The phase order below applies to the manual `/draft-articles` path. The daily path is spec'd at `~/revista-hierba/docs/superpowers/specs/2026-05-13-daily-draft-pr-agent-design.md`.
```

- [ ] **Step 2: Plan the first-week review**

For the first 7 daily PRs:
- [ ] Day 1: review every section for scope compliance, image quality, source credibility.
- [ ] Day 3: check whether dedup is working (no near-duplicates of merged or open-PR topics).
- [ ] Day 5: check whether swap commands round-trip correctly (try one manually).
- [ ] Day 7: aggregate any pattern failures (e.g., consistently weak `plantas`, consistently low-quality images) into a `.claude/commands/daily-draft-pr.md` revision.

- [ ] **Step 3: After week 1, decide on cadence**

If the agent is reliably producing 3–4 good drafts per day, merge as fits the editorial calendar. If it's producing < 50% mergeable output, pause the schedule (`/schedule pause revista-hierba-daily-draft`) and iterate on the slash command.

---

## Self-Review Notes

**Spec coverage:** every component, error mode, and phase from the spec has at least one task. Phase 1 → Task 9; Phase 2 → Tasks 2-4 + Task 9; Phases 3-4 → Task 9 (LLM-driven, no helper script); Phase 5 → Tasks 5-6 + Task 9; Phase 6 → Task 9; Phase 7 → Tasks 7 + 9; Phase 8 → Task 9. Swap-comment handling → Tasks 8 + 9. Scheduling → Task 11. Validation → Tasks 10 + 12.

**Placeholder scan:** no TBD/TODO. Two "CLI to be added in a later task if needed" hedges in Task 9 (Wikimedia + render-pr-body CLI wrappers) are deliberate — the modules are usable directly via `node -e` or short driver scripts; promoting them to first-class CLIs is YAGNI unless usage shows the need.

**Type consistency:** `imageCandidates` shape (url, subject, license, committed) matches between the renderPRBody test fixture (Task 7) and the conceptual manifest produced in Phase 5/6 of the slash command (Task 9). `excludeSlugs` key matches between dedup-snapshot CLI output (Task 4) and renderPRBody input (Task 7). Article numbering "1..N skipping over dropped sections" matches the spec's article-numbering clarification.
