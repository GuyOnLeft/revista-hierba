# `/draft-articles` — Editorial agent for Revista Hierba

**Date:** 2026-05-01
**Status:** Approved design, pending implementation plan
**Owner:** Jeremy Munson
**Editorial author of generated articles:** Victoria Araya

## Purpose

A project-scoped slash command that, on demand, researches and drafts one article per section (`cannabis`, `plantas`, `ciencia`, `derechos`) for Revista Hierba — bilingual, sourced, and aligned with the magazine's editorial policy. The command runs the full pipeline from research through local commit, with one human review gate between English drafts and Spanish translation + publication.

The command is invoked manually (`/draft-articles`) inside an active Claude Code session in the `~/revista-hierba` working directory. It is not scheduled, not autonomous past the review gate, and does not push to origin.

## Editorial constraints

All output must adhere to the published Editorial Policy at `src/pages/politica-editorial.astro`:

- **Independence:** no industry-friendly framing, no advertorial tone.
- **Rigor:** every article cites sources. Distinguish between scientific evidence, opinion, and testimony.
- **Latin American perspective:** prioritize voices and outlets from the region; frame global stories from a LatAm vantage.
- **Human-rights frame:** cannabis and plant policy connect to bodily autonomy, indigenous rights, public health.
- **No misinformation, no romanticism trap:** the existing cannabis-history article explicitly warns against idealizing the past — new articles should hold the same posture.

Tone, structure, and citation style must match existing articles in `src/content/articles/`.

## Workflow

### Phase 1 — Pre-flight

- Read all files in `src/content/articles/` and extract slug, section, title, date.
- Build a "do-not-duplicate" set: any topic covered in the last 30 days, plus any topic that overlaps strongly with an existing article (e.g., don't write a second "history of cannabis" piece).
- Confirm `Victoria Araya` is the byline for this run (default; can be overridden by user inline).
- Confirm git working tree is clean enough that a final single-commit is meaningful (warn if there are unrelated staged changes).

### Phase 2 — Research, by section

For each of the four sections, run a research pass against the curated source list below. Each pass produces a section research note containing:

- Top 24–48hr news item (or "none material") with primary sources.
- One underreported / important issue (any recency) with primary sources.
- Recommended angle for this run.
- Candidate Wikimedia Commons image URL + attribution string.

**Curated source lists (locked):**

- `cannabis` — THC Magazine (AR), Revista Cáñamo (ES), Filter Mag, Marijuana Moment, Volcánicas, El Planteo, Reuters, AP cannabis policy desk
- `plantas` — Mongabay Latam, Agencia Tierra Viva, SciDev.Net Latam, Servindi, Debates Indígenas
- `ciencia` — PubMed (cannabinoid / ethnopharmacology queries), Nature, The Lancet, BMJ, Agencia SINC, SciELO
- `derechos` — CELS (AR), WOLA, Dejusticia, IDPC, Amnesty Americas, Front Line Defenders, Página/12, El Salto, Pikara

If a section's article truly requires a non-listed source (e.g., a primary government document), the agent may include it but must flag the addition to the user during Phase 4.

### Phase 3 — Topic selection

Default mapping:

- `derechos` → timely news (A)
- `cannabis` → timely news (A)
- `ciencia` → deep-dive (B)
- `plantas` → deep-dive (B)

Override: if a section has an unusually strong signal in the opposite mode (e.g., a major peer-reviewed study breaks for `ciencia` in the 24–48hr window), the agent flips that section's mode and notes the reason in its summary message to the user.

One article per section, four total per run.

### Phase 4 — English drafts

For each topic, write a complete English article:

- ~1000–1800 words.
- Lead paragraph that frames the news/issue from a LatAm perspective.
- 2–4 H2 subheads.
- Inline source attribution in prose (e.g., "according to ANVISA", "a study published in *British Journal of Pharmacology*"). No inline hyperlinks.
- Final `## Sources` section: bulleted list, hyperlinks live here, formatted exactly like `src/content/articles/brasil-anvisa-asociaciones-cannabis-2026.md`.

When all four drafts are ready, present them to the user inline for review. **Pause and wait for explicit approval per article before proceeding.** User may request edits; revise until approved.

### Phase 5 — Review gate (human)

Hard gate. The agent does not translate or write files until the user has approved each English draft.

### Phase 6 — Translate, write, build, commit

For each approved English draft:

1. **Translate to Spanish** in Latin American register, matching tone of existing `articles/` files. The Spanish version is the canonical/full version with full frontmatter; the English version mirrors with reduced frontmatter per the schema.

2. **Compute slug.** Lowercase, hyphenated, derived from the Spanish title. Truncate to ~60 chars. Verify no collision with existing slugs.

3. **Write Spanish file** to `src/content/articles/<slug>.md` with frontmatter:
   ```yaml
   title: "<es title>"
   section: <cannabis|plantas|ciencia|derechos>
   date: 2026-05-01
   author: "Victoria Araya"
   excerpt: "<es excerpt, ~25–40 words>"
   image: "<wikimedia commons URL>"
   photo_credit: "<artist/source — license>"
   tag: "<es tag, e.g., Política, Ciencia, Comunidad>"
   title_en: "<en title>"
   excerpt_en: "<en excerpt>"
   tag_en: "<en tag>"
   ```

4. **Write English file** to `src/content/articles-en/<slug>.md` with frontmatter:
   ```yaml
   title: "<en title>"
   excerpt: "<en excerpt>"
   tag: "<en tag>"
   ```

5. **Validate.** Run `npm run build` from `~/revista-hierba`. If the build fails (schema mismatch, broken image URL, missing field), fix and rebuild. Do not commit a failing build.

6. **Commit.** One commit covering all 8 new files:
   ```
   Publish 4 articles by Victoria Araya — 2026-05-01

   - [cannabis] <slug>
   - [plantas] <slug>
   - [ciencia] <slug>
   - [derechos] <slug>
   ```

Do not push. Inform the user the commit is local and ready for them to review with `git diff HEAD~1` and push when satisfied.

## Image policy

- **Source:** Wikimedia Commons only.
- **License preference:** public domain > CC-BY.
- **URL format:** direct file URL (e.g., `https://upload.wikimedia.org/wikipedia/commons/...`).
- **Attribution:** human-readable string in `photo_credit` matching existing pattern (artist/source, year, license note).
- **Fallback:** if no Commons image exists for a topic, the agent flags it during Phase 4 and asks the user to provide a URL + attribution. Do not invent placeholder URLs and do not use AI-generated images.

## Frontmatter conformance

Spanish article schema (from `src/content/config.ts`):
- Required: `title`, `section`, `date`, `author`, `excerpt`, `image`, `tag`
- Optional: `photo_credit`, `title_en`, `excerpt_en`, `tag_en`

English article schema:
- Required: `title`, `excerpt`, `tag`

Slugs must match across the two collections so the English page renders correctly under `/articulo/<slug>`.

## Out of scope

- Pushing to origin.
- Scheduling or recurring runs (use `/loop` separately if desired).
- Editing existing articles.
- Creating new sections or modifying the schema.
- Republishing topics covered within the last 30 days.
- Using sources outside the curated list without flagging.
- Stock photos, Unsplash, AI-generated images.
- Modifying author for previously-published articles.

## Failure modes and handling

| Failure | Handling |
|---|---|
| No 24–48hr news in a section that defaulted to A | Flip section to B, note reason in summary. |
| No usable Wikimedia image | Flag inline during Phase 4, request user input before Phase 6. |
| Slug collision with existing file | Append `-2` or refine slug; never overwrite existing files. |
| `npm run build` fails | Fix offending field/image URL, rebuild. Never commit a broken tree. |
| User rejects an English draft | Revise the single article; do not regenerate the others. |
| User stops mid-review | Leave drafts in chat; do not write files. |

## Implementation surface

A single file: `~/revista-hierba/.claude/commands/draft-articles.md`. The slash command body contains the full prompt that drives the workflow above. It uses built-in tools (`WebSearch`, `WebFetch`, `Read`, `Write`, `Edit`, `Bash`); no MCP servers, no settings.json hooks, no subagents.

## Open questions

None. All design decisions resolved during brainstorming on 2026-05-01.
