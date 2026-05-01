# `/draft-articles` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a project-scoped slash command at `~/revista-hierba/.claude/commands/draft-articles.md` that drives a research → English drafts → review gate → Spanish translation → local commit pipeline for Revista Hierba, producing one bilingual article per section per run, authored as Victoria Araya.

**Architecture:** A single Markdown file in the Claude Code project commands directory. Its body is the orchestration prompt; it leans on built-in tools (`WebSearch`, `WebFetch`, `Read`, `Write`, `Edit`, `Bash`) and the existing project conventions in `~/revista-hierba`. No subagents, no settings.json hooks, no MCP servers.

**Tech Stack:** Claude Code slash command (Markdown frontmatter + prompt body), Astro content collections (existing), Wikimedia Commons (image source), git (single local commit, no push).

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `.claude/commands/draft-articles.md` | Create | Orchestration prompt for the entire workflow |
| `docs/superpowers/specs/2026-05-01-draft-articles-command-design.md` | Already exists | Source-of-truth design document |

No other files are created or modified by this plan. The slash command itself, when run, will create files under `src/content/articles/` and `src/content/articles-en/` — but those are runtime outputs, not implementation artifacts.

---

## Task 1: Scaffold the slash command file with frontmatter and Phase 1 (pre-flight)

**Files:**
- Create: `~/revista-hierba/.claude/commands/draft-articles.md`

- [ ] **Step 1: Create the commands directory**

Run:
```bash
mkdir -p ~/revista-hierba/.claude/commands
```

Expected: directory exists, no output.

- [ ] **Step 2: Write the slash command file with frontmatter and Phase 1 body**

Create `~/revista-hierba/.claude/commands/draft-articles.md` with this exact content:

````markdown
---
description: Research, draft, review, translate, and commit one bilingual article per section for Revista Hierba (Victoria Araya, byline)
---

You are the editorial agent for **Revista Hierba**, a bilingual (ES/EN) magazine on cannabis, medicinal plants, science, and human rights, written from a Latin American perspective.

Read the editorial policy at `src/pages/politica-editorial.astro` before doing anything else. Every article you produce must adhere to it: independence from industry, rigor and citation, LatAm-first framing, human-rights frame, no misinformation, no romanticism trap.

The byline for every article in this run is **Victoria Araya** unless the user overrides inline.

## Workflow overview

1. Pre-flight (read existing slugs, build do-not-duplicate set)
2. Research per section (curated source list, recent + underreported)
3. Topic selection per section
4. Write four English drafts
5. Review gate — wait for user approval
6. Translate, write files, build, commit (no push)

Announce each phase as you enter it. After Phase 4 you must stop and wait for the user.

---

## Phase 1 — Pre-flight

1. List every file in `src/content/articles/`. For each file, read the frontmatter and extract `title`, `section`, `date`, slug (filename without `.md`).

2. Build a "do-not-duplicate" set:
   - Any topic with `date` within the last 30 days from today.
   - Any topic whose subject overlaps strongly with an existing article (e.g., do not write a second history-of-cannabis piece, do not republish a recent ANVISA story).

3. Confirm the byline. Default: `Victoria Araya`. If the user has named a different author in the slash invocation, use that instead.

4. Check git working tree state with `git status --short`. If there are unrelated staged changes, warn the user — your final commit should be just the new article files.

5. Print a one-paragraph summary of what you found: count of existing articles, recency of the most recent per section, and the do-not-duplicate list. Then proceed to Phase 2.
````

- [ ] **Step 3: Verify the file was created and is non-empty**

Run:
```bash
test -s ~/revista-hierba/.claude/commands/draft-articles.md && wc -l ~/revista-hierba/.claude/commands/draft-articles.md
```

Expected: line count printed (~30 lines so far), exit 0.

- [ ] **Step 4: Commit**

```bash
cd ~/revista-hierba && git add .claude/commands/draft-articles.md && git commit -m "Add /draft-articles command — frontmatter + Phase 1 (pre-flight)"
```

---

## Task 2: Append Phase 2 (research) with the curated source list

**Files:**
- Modify: `~/revista-hierba/.claude/commands/draft-articles.md` (append)

- [ ] **Step 1: Append Phase 2 to the file**

Append this exact content to `~/revista-hierba/.claude/commands/draft-articles.md`:

````markdown

---

## Phase 2 — Research, by section

For each of the four sections (`cannabis`, `plantas`, `ciencia`, `derechos`) run a research pass against the curated source list below. Use `WebSearch` and `WebFetch` against the listed domains. Do not use sources outside this list without flagging the addition explicitly during Phase 4.

**Curated sources (locked):**

- **`cannabis`** — thcmagazine.com.ar, lamarihuana.com (Revista Cáñamo), filtermag.org, marijuanamoment.net, volcanicas.com, elplanteo.com, reuters.com, apnews.com
- **`plantas`** — es.mongabay.com, agenciatierraviva.com.ar, scidev.net (LatAm), servindi.org, debatesindigenas.org
- **`ciencia`** — pubmed.ncbi.nlm.nih.gov, nature.com, thelancet.com, bmj.com, agenciasinc.es, scielo.org
- **`derechos`** — cels.org.ar, wola.org, dejusticia.org, idpc.net, amnesty.org/en/latin-america-and-the-caribbean, frontlinedefenders.org, pagina12.com.ar, elsaltodiario.com, pikaramagazine.com

For each section, produce a short research note (in chat, not on disk) containing:

1. **Top 24–48hr news item** (or "none material this window") — primary source URL(s), 2–3 sentence summary, why it matters from a LatAm perspective.
2. **One underreported / important issue** (any recency) — primary source URL(s), summary, angle.
3. **Recommended angle for this run** — which of the two to develop, and why.
4. **Candidate Wikimedia Commons image** — search `commons.wikimedia.org`, return a direct file URL plus a `photo_credit` string formatted like `"Heinrich Füllmaurer, De Historia Stirpivm (1542) — Dominio Público"`.

Prefer primary sources (court rulings, ministry resolutions, peer-reviewed papers, NGO reports) over secondary coverage when both are available.
````

- [ ] **Step 2: Verify append**

Run:
```bash
grep -c "Phase 2" ~/revista-hierba/.claude/commands/draft-articles.md
```

Expected: `2` (one in workflow overview, one as section header).

- [ ] **Step 3: Commit**

```bash
cd ~/revista-hierba && git add .claude/commands/draft-articles.md && git commit -m "Add Phase 2 (research) with curated per-section source list"
```

---

## Task 3: Append Phase 3 (topic selection) and Phase 4 (English drafts)

**Files:**
- Modify: `~/revista-hierba/.claude/commands/draft-articles.md` (append)

- [ ] **Step 1: Append Phase 3 and Phase 4**

Append this exact content:

````markdown

---

## Phase 3 — Topic selection

Default mapping (timely news vs deep-dive):

- `derechos` → timely news
- `cannabis` → timely news
- `ciencia` → deep-dive
- `plantas` → deep-dive

Override rule: if a section has an unusually strong signal in the opposite mode (e.g., a major peer-reviewed study breaks for `ciencia` in the 24–48hr window, or there is no real news for `derechos` this week), flip that section. Note the flip and the reason in your summary.

Choose exactly one topic per section. Four total.

---

## Phase 4 — Write English drafts

For each of the four chosen topics, write a complete English article.

**Length:** ~1000–1800 words.

**Structure:**

1. Lead paragraph that frames the news/issue from a Latin American vantage. No "in recent years" filler — start concrete.
2. 2–4 H2 subheads (`##`) that move the argument forward, not generic dividers.
3. Inline source attribution in prose ("according to ANVISA", "a study in *British Journal of Pharmacology*"). **No inline hyperlinks.**
4. Final `## Sources` section: bulleted list, one bullet per source, with hyperlinks. Format must match `src/content/articles/brasil-anvisa-asociaciones-cannabis-2026.md` — read that file first as a style reference for sourcing format.

**Editorial discipline:**

- No advertorial tone. No "the future of cannabis is bright" boosterism.
- Distinguish scientific evidence, opinion, and testimony explicitly.
- Avoid the romanticism trap (see `src/content/articles/cannabis-planta-que-nos-encontro.md` — the existing article warns against idealizing the past; new articles must hold the same posture).
- Where a story has indigenous-rights or human-rights stakes, name them.

**Output:** present all four English drafts inline in chat, clearly labeled by section. After the fourth draft, write:

> **REVIEW GATE — Phase 4 complete. Please approve each draft (or request edits) before I translate and write files.**

Then stop. Do not proceed to Phase 5 actions until the user explicitly approves.
````

- [ ] **Step 2: Verify append**

Run:
```bash
grep -c "^## Phase" ~/revista-hierba/.claude/commands/draft-articles.md
```

Expected: `4` (Phases 1, 2, 3, 4).

- [ ] **Step 3: Commit**

```bash
cd ~/revista-hierba && git add .claude/commands/draft-articles.md && git commit -m "Add Phase 3 (topic selection) and Phase 4 (English drafts + review gate)"
```

---

## Task 4: Append Phase 5 (review gate) and Phase 6 (translate / write / build / commit)

**Files:**
- Modify: `~/revista-hierba/.claude/commands/draft-articles.md` (append)

- [ ] **Step 1: Append Phase 5 and Phase 6**

Append this exact content:

````markdown

---

## Phase 5 — Review gate (human)

This is a hard stop. Do not write any files, do not translate, do not commit until the user has approved each English draft.

If the user requests edits to a single article, revise that one article only. Do not regenerate the others. After revision, re-present the updated draft and ask again.

If the user approves all four, proceed to Phase 6.

---

## Phase 6 — Translate, write, build, commit

For each approved English draft, in order:

### 6.1 Translate to Spanish

Translate to Spanish in Latin American register. Match the tone of existing files in `src/content/articles/`. Read at least one of those files first as a style reference. The Spanish version is the canonical, fully-fronted version; the English version mirrors with reduced frontmatter.

### 6.2 Compute the slug

- Lowercase, hyphenated, derived from the Spanish title.
- Strip accents and diacritics (`á → a`, `ñ → n`, etc.).
- Truncate to ~60 characters at a word boundary.
- Verify no collision: `ls src/content/articles/<slug>.md` must return "No such file." If it collides, append `-2` and retry.

### 6.3 Write the Spanish file

Write to `src/content/articles/<slug>.md` with this frontmatter (fields per `src/content/config.ts`):

```yaml
---
title: "<es title>"
section: <cannabis|plantas|ciencia|derechos>
date: <today, YYYY-MM-DD>
author: "Victoria Araya"
excerpt: "<es excerpt, 25–40 words>"
image: "<wikimedia commons direct file URL>"
photo_credit: "<artist/source — license note>"
tag: "<es tag, e.g., Política, Ciencia, Comunidad, Derechos>"
title_en: "<en title>"
excerpt_en: "<en excerpt, 25–40 words>"
tag_en: "<en tag>"
---

<full Spanish article body, with inline source attribution and ## Fuentes section at end>
```

The Spanish source list section heading is `## Fuentes`, not `## Sources`.

### 6.4 Write the English file

Write to `src/content/articles-en/<slug>.md` with reduced frontmatter:

```yaml
---
title: "<en title>"
excerpt: "<en excerpt>"
tag: "<en tag>"
---

<full English article body, with ## Sources section at end>
```

### 6.5 Validate the build

Run from `~/revista-hierba`:

```bash
npm run build
```

Expected: build completes without error. If it fails (schema validation, broken image URL, missing field, slug mismatch), fix the offending file and rebuild. Do not commit a failing tree.

### 6.6 Commit

When all four article pairs are written and the build is green, run a single commit:

```bash
git add src/content/articles/<slug1>.md src/content/articles/<slug2>.md src/content/articles/<slug3>.md src/content/articles/<slug4>.md \
        src/content/articles-en/<slug1>.md src/content/articles-en/<slug2>.md src/content/articles-en/<slug3>.md src/content/articles-en/<slug4>.md
git commit -m "Publish 4 articles by Victoria Araya — <YYYY-MM-DD>

- [cannabis] <slug1>
- [plantas] <slug2>
- [ciencia] <slug3>
- [derechos] <slug4>"
```

### 6.7 Report

Tell the user:

> Commit `<short SHA>` is local. Review with `git diff HEAD~1` or `npm run dev`, then `git push` when satisfied. Netlify will auto-deploy.

**Do not push.** Pushing is the user's call.

---

## Image policy

- Source: Wikimedia Commons only.
- License preference: public domain > CC-BY.
- URL format: direct file URL on `upload.wikimedia.org`.
- Attribution: human-readable string (artist/source, year, license).
- If no Commons image exists for a topic: flag during Phase 4 and ask the user for a URL + attribution before Phase 6. Do not invent URLs. Do not use AI-generated images. Do not use Unsplash or other stock.

## Out of scope

- Pushing to origin.
- Editing existing articles.
- Creating new sections or schema fields.
- Republishing topics covered in the last 30 days.
- Sources outside the curated list (without explicit flag).
- Stock or AI-generated images.
````

- [ ] **Step 2: Verify all six phases present**

Run:
```bash
grep "^## Phase" ~/revista-hierba/.claude/commands/draft-articles.md
```

Expected output:
```
## Phase 1 — Pre-flight
## Phase 2 — Research, by section
## Phase 3 — Topic selection
## Phase 4 — Write English drafts
## Phase 5 — Review gate (human)
## Phase 6 — Translate, write, build, commit
```

- [ ] **Step 3: Commit**

```bash
cd ~/revista-hierba && git add .claude/commands/draft-articles.md && git commit -m "Add Phases 5–6 (review gate, translate/write/build/commit)"
```

---

## Task 5: Smoke test — verify Claude Code recognizes the command and current site builds

**Files:** none modified.

- [ ] **Step 1: Verify the file is well-formed YAML frontmatter**

Run:
```bash
head -3 ~/revista-hierba/.claude/commands/draft-articles.md
```

Expected:
```
---
description: Research, draft, review, translate, and commit one bilingual article per section for Revista Hierba (Victoria Araya, byline)
---
```

- [ ] **Step 2: Verify current site builds (baseline before any article runs)**

Run from `~/revista-hierba`:
```bash
npm run build 2>&1 | tail -20
```

Expected: build completes without error. If it fails, the failure is pre-existing and unrelated to this plan — flag to the user and stop.

- [ ] **Step 3: List Claude Code commands to confirm registration**

Tell the user to run `/help` or just type `/draft` in their Claude Code session — autocomplete should show `/draft-articles` with the description "Research, draft, review, translate, and commit one bilingual article per section for Revista Hierba (Victoria Araya, byline)".

If autocomplete does not show it, the most likely cause is that the user opened Claude Code from a working directory other than `~/revista-hierba`. Project commands are scoped to the directory.

- [ ] **Step 4: Final commit (none expected)**

This task creates no files. If `git status` shows changes, investigate before continuing.

```bash
cd ~/revista-hierba && git status --short
```

Expected: empty output (or only the pre-existing `.gitignore` / `.netlify/` modifications from before this plan).

---

## Done

After Task 5 passes, the slash command is shipped and ready to use. The next time you `cd ~/revista-hierba` and run `/draft-articles`, the agent runs the full pipeline, stops at the review gate, and (after your approval) commits four bilingual articles authored by Victoria Araya.
