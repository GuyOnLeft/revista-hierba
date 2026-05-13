# Daily Draft PR Agent — Design

**Date:** 2026-05-13
**Status:** Approved, ready for implementation plan
**Author:** Jeremy + Claude (brainstorming session)

## Purpose

Replace the manual nightly `/draft-articles` cadence with an autonomous remote Claude agent that runs daily at 02:00 America/Denver, opens a single GitHub pull request containing 4 bilingual article drafts (one per section: cannabis, plantas, ciencia, derechos) with 3 Wikimedia Commons image candidates per article. Jeremy is the sole approver. Victoria Araya receives a courtesy email with the Netlify deploy-preview URL — informational, not blocking. Merging the PR publishes to revistahierba.com via the existing Netlify deploy-on-main pipeline.

## Goals

- Eliminate the manual nightly invocation of `/draft-articles`.
- Reuse existing infrastructure: Netlify deploy previews replace PDF attachments; GitHub PRs replace email approval gates; commit-per-article enables selective revert.
- Keep editorial discretion: Jeremy reviews every PR; nothing publishes without merge.
- Preserve photo accountability: 3 Wikimedia candidates per article visible in the PR; one swap command per article supported.

## Non-Goals

- This does not replace `/draft-articles`. The Victoria-PDF pipeline stays intact for manual on-demand use.
- This is not an attempt to enable Victoria as a GitHub user. She remains an editorial collaborator notified by email; approval authority is Jeremy alone.
- This does not change article frontmatter schema, the Astro content pipeline, or the public site's appearance.

## Architecture

A daily cron-scheduled remote Claude agent registered via the `/schedule` skill executes a new project-scoped slash command at `~/revista-hierba/.claude/commands/daily-draft-pr.md`. The command runs an eight-phase pipeline (Setup → Dedup → Research → Drafts → Image search → Write+commit → Open PR → Email Victoria) and exits.

```
┌─────────────────────────────────────────────────────────────┐
│ Anthropic remote scheduler (/schedule)                      │
│   cron: 0 2 * * *  TZ: America/Denver                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ fires daily
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Remote Claude agent                                         │
│   • gh CLI authenticated                                    │
│   • git clone github.com/<user>/revista-hierba (fresh)      │
│   • Gmail MCP for Victoria notification                     │
│   • Anthropic LLM for research, drafting, image scoring     │
└──────────────────────────┬──────────────────────────────────┘
                           │ invokes
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ /daily-draft-pr (slash command, 8 phases)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ outputs
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Daily PR on revista-hierba                                  │
│   • Branch: drafts/YYYY-MM-DD                               │
│   • 4 commits (one per article)                             │
│   • PR body: per-article sections + 3 image candidates each │
│   • Netlify auto-builds deploy preview                      │
│   • Courtesy email to Victoria with preview URL             │
└──────────────────────────┬──────────────────────────────────┘
                           │ Jeremy reviews
                           ▼
       ┌───────────────────┼───────────────────┐
       │ Merge → publish   │ Comment "use #N   │
       │ (deploys to main) │  on article M"    │
       │                   │ → next-day swap   │
       └───────────────────┘
```

## Components

### 1. `/schedule` routine

Registered once via the `/schedule` skill. Configuration:

- **Cron:** `0 2 * * *`
- **Timezone:** `America/Denver` (handles DST automatically)
- **Entry point:** invokes `/daily-draft-pr` in the revista-hierba working directory.
- **Idempotency:** if a `drafts/YYYY-MM-DD` branch already exists for today's date, the agent aborts at Phase 1 without side effects.

### 2. `/daily-draft-pr` slash command

New file at `~/revista-hierba/.claude/commands/daily-draft-pr.md`. Project-scoped, non-interactive (no review gate inside the command — the PR is the gate).

The existing `~/revista-hierba/.claude/commands/draft-articles.md` remains untouched and continues to support manual on-demand use with the Victoria-PDF flow.

#### Phase 1 — Setup
- `git pull origin main` then `git checkout -b drafts/YYYY-MM-DD`.
- If branch exists, abort cleanly.

#### Phase 2 — Dedup snapshot
- Read every `.md` in `src/content/articles/` and `src/content/articles-en/`; collect slugs + titles + dates.
- `gh pr list --state all --search "head:drafts/" --json title,headRefName,closedAt --limit 60`, filter to PRs closed/open within last 30 days. Read their PR bodies for the slugs listed in their per-article sections.
- Union of both lists → recent topics to avoid.

#### Phase 3 — Research
- Apply the reader-first + local-tiebreaker rule from memory `feedback_revista_hierba_geographic_scope.md`.
- Per section, run a local-first search pass against curated sources from `draft-articles.md`. Apply the readability test ("would a reader open this?"). If local is empty or weak, widen to regional then global.
- Honest skip is allowed per section. A 3-article PR is valid output; PR body flags the skipped section.

#### Phase 4 — Drafts
- 4 English drafts (~1100–1400 words each), `## Sources` end-list, no inline hyperlinks.
- Immediate Spanish translation per draft (`## Fuentes`, LatAm register). Translation happens before any human review.
- Frontmatter matches existing schema in `src/content/config.ts`:
  - `articles/` (Spanish, full frontmatter): title, section, date, author, excerpt, image, photo_credit, tag, title_en, excerpt_en, tag_en.
  - `articles-en/` (English, reduced): title, excerpt, tag.

#### Phase 5 — Image search
- Per article: extract 3–5 high-signal nouns via LLM. Avoid generic terms.
- Query Wikimedia Commons API (`action=query&list=search&srnamespace=6&srsearch=<term>`) per noun, top 5 results each.
- For each candidate, fetch `imageinfo` extmetadata. Filter:
  - License ∈ {PD, CC-BY} only. Reject CC-BY-SA, CC-BY-NC, fair-use, unclear.
  - Reject SVG and diagrams.
  - Reject anything < 800px on long edge.
- Score remaining candidates by (a) semantic match to article topic, (b) photograph realism, (c) upload recency as weak tiebreaker.
- Top 3 by score → PR candidates. Top 1 → committed to `public/images/articles/<slug>.<ext>`.
- If fewer than 3 candidates survive, mark article with `needs-image-review`; commit best available and flag in PR body.

#### Phase 6 — Write files + commit
- 4 ES files into `src/content/articles/<slug>.md`.
- 4 EN files into `src/content/articles-en/<slug>.md`.
- Photo credit field populated as `Foto: <Artist> / Wikimedia Commons (<LicenseShortName>)`.
- `npm run build` must succeed before continuing. On failure, abort to GitHub issue (see Error Handling).
- One commit per article (4 commits total). Each commit contains: ES file + EN file + image. Commit message format: `<section>: <slug>`.

#### Phase 7 — Open PR
- `gh pr create --base main --head drafts/YYYY-MM-DD --title "Daily drafts — YYYY-MM-DD" --label daily-draft --body @<body-file>`.
- PR body format documented below.
- Apply `needs-image-review` label if any article triggered the image fallback.

#### Phase 8 — Email Victoria
- Gmail MCP `send` action (not `create_draft` — no attachments needed since the deploy preview replaces PDFs).
- Recipient: `arayaflorenciavictoria@gmail.com`. CC: `jmunson0711@gmail.com`.
- Subject: `Revista Hierba — Borradores del día · <fecha en español>`.
- Body (Spanish): one paragraph greeting; "Para tu información — Jeremy aprueba antes de publicar"; bulleted preview of the four section topics (or 3 with explicit skip note); link to the Netlify deploy-preview URL.

### 3. PR body format

````markdown
# Daily drafts — 2026-05-13

**Deploy preview:** https://deploy-preview-NNN--revistahierba.netlify.app
**Dedup window:** 30 days · N topics excluded ([list](#dedup))

---

## 1. `<section>` — <Spanish headline>
**Slug:** `<slug>`
**Local lead** / **Widened to <region>** · Sources: <comma-separated>
**Excerpt:** <2-sentence excerpt>

**Image candidates** (committed pick: #1)
| #1 ✅ committed | #2 | #3 |
|---|---|---|
| ![](candidate-1-thumb.jpg) | ![](candidate-2-thumb.jpg) | ![](candidate-3-thumb.jpg) |
| <subject>, [Wikimedia](url1) PD | <subject>, [Wikimedia](url2) CC-BY | <subject>, [Wikimedia](url3) CC-BY |

To swap: comment `use #2 on article 1`

---

[sections 2–4 in same shape; or `⚠️ No qualifying story for <section>` if skipped]

---

<a name="dedup"></a>
## Dedup excluded
- `<slug>` (merged YYYY-MM-DD)
- `<slug>` (open PR #NN)
- ...
````

### 4. Swap-command handling

PR comments matching the regex `^use #([123]) on article ([1-4])$` (case-insensitive, single line) trigger an image swap on the next daily run. **Article numbering rule:** articles in the PR body are numbered sequentially starting at 1, skipping over any sections that were dropped. A 3-article PR with `plantas` skipped has articles 1 (cannabis), 2 (ciencia), 3 (derechos) — there is no article 4. This keeps swap commands unambiguous: "article N" always means the Nth visible article in today's PR body. The agent's Phase 2 expands to include "read open daily-draft PRs for unprocessed swap comments" and applies pending swaps before opening today's PR. Swap commits are pushed to the existing draft branch, not a new one. Idempotent — already-applied swaps (detected by comparing committed image filename to swap target) are no-ops.

If you need a same-day swap, manually invoke `/daily-draft-pr --process-swaps-only` (or just re-run the command).

## Data Flow

```
Wikimedia Commons API ──┐
                        ├──► /daily-draft-pr ──► git branch drafts/YYYY-MM-DD
Web research (LLM) ─────┤                            │
                        │                            ▼
existing articles/ ─────┘                       4 commits
   (dedup source)                                    │
                                                     ▼
                                              gh pr create
                                                     │
                                ┌────────────────────┼────────────────────┐
                                ▼                    ▼                    ▼
                          Netlify preview      Gmail to Victoria    daily-draft label
                                │                                          │
                                └──── Jeremy reviews ──── merges ──────────┘
                                                            │
                                                            ▼
                                                   main → Netlify prod build
                                                            │
                                                            ▼
                                                   revistahierba.com
```

## Error Handling

| Failure mode | Behavior |
|---|---|
| No qualifying story for a section after widening | Skip section silently; PR body shows `⚠️ no qualifying story for <section>`. 3-article PR is valid. |
| `npm run build` fails after writing files | Abort before Phase 7. Open a GitHub issue titled `Daily draft build failure — YYYY-MM-DD` with the error and the branch name. Skip Phase 8. |
| Wikimedia returns no usable images for an article | Commit best available (or a section-default placeholder if none); apply `needs-image-review` label; PR body flags the article. |
| `gh pr create` fails | Retry once with 30s backoff, then bail to GitHub issue. |
| Gmail send fails | Log to PR comment thread on the just-opened PR; do not abort (the PR itself is the primary surface; the email is a courtesy). |
| `drafts/YYYY-MM-DD` already exists | Abort Phase 1 cleanly. No side effects. |

## Testing Strategy

- **Unit-level (slash command logic):** the slash command is a markdown spec, not testable code. Validation = first 7 days of monitored runs.
- **Dry-run mode:** `/daily-draft-pr --dry-run` runs Phases 1–6 (research → write → build) but stops before `gh pr create`. Leaves the branch locally for inspection. Used for initial validation before turning on the schedule.
- **First-week monitoring:** Jeremy reviews every PR in the first week. Any systematic failure mode (bad image scoring, dedup miss, frontmatter drift) gets fixed in the slash command before week 2.

## Coexistence with `/draft-articles`

| Trait | `/draft-articles` (existing) | `/daily-draft-pr` (new) |
|---|---|---|
| Trigger | Manual invocation by Jeremy | Daily cron at 02:00 Denver |
| Approver | Victoria (PDF email reply) | Jeremy (PR merge) |
| Victoria's role | Gating approver | Informational (email only) |
| Output | Local commits, no push | PR on GitHub |
| Image flow | Per-article ad-hoc | 3 Wikimedia candidates per article in PR body |
| Use case | One-off manual cycles, special editorial pushes | Steady daily cadence |

Memory `feedback_revista_hierba_workflow.md` will be updated post-implementation to note both paths exist and when to use each.

## Open Questions

None — all design choices resolved in brainstorming session.

## Future Considerations (not in scope)

- Automated swap-comment processing on a sub-daily cron (currently next-daily-run only).
- Multi-image articles (currently one image per article).
- Image AI generation as fallback when Wikimedia is empty (currently placeholder + manual review).
- Section weighting (e.g., publish at most 1 `cannabis` per week to balance the site).
