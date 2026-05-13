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
