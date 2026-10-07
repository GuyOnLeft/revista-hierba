---
name: revista-hierba
description: Publishing and editing articles on Revista Hierba (revistahierba.com), the bilingual ES/EN magazine on cannabis, medicinal plants, science and patient rights. Use when asked to "subir un artículo a Hierba", publish/edit/unpublish an article, turn a contributor's Google Doc or .docx into a post, fix an article's image or crop, or work on this repo's site.
---

# Revista Hierba

This skill lives in the repo, so anyone with access who runs Claude Code here gets it. **The repo is public:** don't commit phone numbers, emails, private links or anything personal into this file or anywhere else in the repo.

## Where things live

| What | Where |
|---|---|
| Live site | https://revistahierba.com (`public/CNAME`) |
| Repo | `GuyOnLeft/revista-hierba`. This repo. |
| Stack | Astro 4 static site, articles as Markdown content collections in `src/content/` |
| Deploy | GitHub Pages via `.github/workflows/deploy.yml`, triggered by **any push to `main`**. Takes about 1 minute. No preview deploys. A failed build doesn't deploy, so the live site keeps the last good version. |
| Article calendar | The team's Google Sheet ("CALENDARIO DE ARTÍCULOS", tab `00_Artículos`). Ask the team for the link. Columns: Entrega (due date), Redactor/a, Link (text doc), Material (image), Entregado, Web, Redes, Estado. |
| Newsletter | Formspree form in `src/components/Newsletter.astro` |
| Analytics | Umami script in `src/components/Layout.astro` |

Netlify is gone (the site moved to GitHub Pages on 2026-05-12). Anything that still mentions Netlify is stale.

## Publishing a contributor article

The usual trigger: a contributor's piece is marked delivered in the sheet (`Entregado` checked, `Web` not checked) and someone asks to upload it. Past examples to copy: commits `151ae3a` ("Por las ramas"), `3e3f32e` (mushrooms and diabetes) and `2bcbc0f` ("Plantas sagradas" review).

1. **Get the text.** A Google Doc exports as .docx via `https://docs.google.com/document/d/<id>/export?format=docx`. An uploaded Word file in Drive downloads via `https://drive.google.com/uc?export=download&id=<id>`. Both work only if the file is link-shared. Otherwise open it in a browser signed in to an account with access. Convert with `textutil -convert txt -stdout file.docx` (macOS) or pandoc. Check the original for italics, such as book titles.
2. **Get the image.** Contributor photos are often private Drive files: request access or ask the person to share it. Save it as `public/<slug>.jpg` and use `image: "/<slug>.jpg"`. With no photo, use a Wikimedia Commons direct file URL (`upload.wikimedia.org/...`) and `photo_credit: "<Artist> — <License> · Wikimedia Commons"`. **Never invent a photo credit.** Leave `photo_credit` out if you don't know it. No stock or AI-generated images.
3. **Write two files** with the same slug (kebab-case from the Spanish title, accents stripped, about 60 characters max):
   - `src/content/articles/<slug>.md`: Spanish, with the full frontmatter (schema in `src/content/config.ts`):
     ```yaml
     title: "..."
     section: plantas            # cannabis | plantas | ciencia | derechos
     date: 2026-10-06            # the publish date
     author: "Nombre Apellido"   # or "La Redacción" for unsigned pieces
     excerpt: "..."              # 25–45 words
     image: "/slug.jpg"
     photo_credit: "..."         # optional
     image_position: "center top" # optional, see step 5
     tag: "Reseña"
     title_en: "..."
     excerpt_en: "..."
     tag_en: "Book Review"
     ```
   - `src/content/articles-en/<slug>.md`: `title`, `excerpt`, `tag`, then the full English translation. **Every article is bilingual.** Add a short translator's note when wordplay doesn't carry over (see "Por las ramas").
4. **Edit lightly.** Editorial policy for signed contributors (`src/pages/politica-editorial.astro`): edit for clarity, length and factual accuracy, and never change the author's position or arguments. Fix typos and accents, italicize titles of works, and list every change you made for the person who asked.
5. **Check the crop.** Cards crop with `object-fit: cover`: the homepage featured card at 16:9, smaller cards at 3:2. **The newest article becomes the homepage's featured card.** If the subject sits near the top of a portrait or near-square photo, the centered crop cuts it off, so set `image_position: "center top"` (any CSS `object-position` works). The article page itself shows the whole image.
6. **Build if you can.** `npm ci` (once), then `npm run build`. If you can't install dependencies, check the frontmatter by hand against `src/content/config.ts`. The Actions build is the backstop.
7. **Commit and push to `main`.** This publishes, so confirm with whoever asked first. Commit message:
   ```
   Publish "<short title>" by <Author>

   - [<section>] <slug> (ES + EN)
   - Source doc: "<doc name>" (Hierba article calendar, <Entrega>)
   - Image: <source>
   ```
8. **Verify it's live.** Run `gh run watch <run-id> --exit-status`, then load the article page, the image and the homepage. Article URLs have **no trailing slash**: `https://revistahierba.com/articulo/<slug>`. Look at the homepage card to check the crop.
9. **Close the loop.** Tick `Web` in the sheet and tell the person who asked that it's live, with the link.

To **fix** a published article, edit both language files, commit "Fix <what> in <title>", and push. To **unpublish**, delete both files (and its image in `public/`), then commit and push.

## Site structure

- `src/pages/articulo/[slug].astro` is the article page (the hero image uses `object-fit: contain`).
- `src/components/ArticleGrid.astro` is the homepage: 1 featured card plus 2 secondary, newest first. `src/pages/articulos.astro` lists all articles. `src/pages/secciones/{section}.astro` plus `src/components/SectionPage.astro` are the section pages (top 3). `src/pages/secciones/todos/[section].astro` lists a whole section.
- Bilingual UI: `.es-only` / `.en-only` spans are toggled by `public/i18n.js`, and the choice is stored in `localStorage.lang`. UI strings live in that file.
- Other pages: `editorial` (Número 001, "Carta a quienes leen"), `nosotros`, `politica-editorial`, `contacto`, `privacidad`.
- Dates are formatted with `timeZone: 'UTC'`, which fixed an off-by-one-day bug. Keep that in any new date code.
- `author: "La Redacción"` shows as "The Editorial Team" in English.

## Editorial line

- **Mission:** medicinal plants, cannabis and patient rights, from a Latin American perspective. Off-mission: lithium or mining, general environment, and land rights without a medicinal-plant or patient angle.
- **Sections:** `cannabis` (policy, culture, regulation), `plantas` (ethnobotany and traditional medicine, centred on a specific plant or practice), `ciencia` (peer-reviewed findings, clinical trials, pharmacology), `derechos` (health access, criminalization of users, patient rights).
- **Policy:** independence from industry, sources cited, evidence kept separate from opinion and testimony, no misinformation, and errors corrected openly. Content license: CC BY-NC-SA 4.0.
- **Spanish** is the canonical version, written in Latin American register. Source lists go under `## Fuentes` (ES) and `## Sources` (EN).

## Daily AI drafts

A job on Jeremy's Mac (not in this repo) writes one AI draft each morning, with sections rotating, under the byline "La Redacción". Every draft is reviewed through a preview link before anything is published:

1. The draft goes into `src/content/drafts/<n>-<token>.md` and `src/content/drafts-en/<n>-<token>.md` (the same schemas as articles) and is pushed. It appears at `https://revistahierba.com/borrador/<n>-<token>`: the real article layout with a "Borrador · sin publicar" banner. It's `noindex`, left out of the sitemap, and not linked from anywhere.
2. The editor gets that link on WhatsApp. The page's buttons, or a WhatsApp reply, say `publicar N`, `cambios N: ...` or `descartar N`.
3. **publicar** moves both files into `articles/` with today's date (commit `Publish "<title>" (La Redacción), draft #N`). **cambios** rewrites the draft at the same link. **descartar** deletes it.

Don't hand-edit files in `src/content/drafts*`: the job owns them. To publish or fix an AI article by hand once it's live, use the steps above.
