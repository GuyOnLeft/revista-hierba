---
title: Revista Hierba — Missing Pages
date: 2026-04-27
status: approved
---

## Scope

Build 8 missing pages so all nav links resolve. Current site has only `/` (index). All nav links point to `#`.

## Pages to Build

| Route | Title | Template |
|---|---|---|
| `/editorial` | Carta a los Lectores | Unique |
| `/secciones` | Nuestras Secciones | Unique |
| `/secciones/cannabis` | Cannabis | SectionPage |
| `/secciones/plantas` | Plantas Medicinales | SectionPage |
| `/secciones/ciencia` | Ciencia | SectionPage |
| `/secciones/derechos` | Derechos Humanos | SectionPage |
| `/nosotros` | Quiénes Somos | Unique |
| `/contacto` | Escribinos | Unique |

## Architecture — Option B (approved)

Create a shared `Layout.astro` wrapper used by all new pages. The 4 section sub-pages share a `SectionPage.astro` component that accepts props for title, slug, description, and article list.

Index page (`/`) stays untouched.

## New Files

- `src/components/Layout.astro` — Nav + Footer + `<slot />` + i18n script
- `src/components/SectionPage.astro` — shared section sub-page template (accepts props)
- `src/pages/editorial.astro`
- `src/pages/secciones/index.astro`
- `src/pages/secciones/cannabis.astro`
- `src/pages/secciones/plantas.astro`
- `src/pages/secciones/ciencia.astro`
- `src/pages/secciones/derechos.astro`
- `src/pages/nosotros.astro`
- `src/pages/contacto.astro`

## Files to Update

- `src/components/Nav.astro` — change all `href="#"` to actual routes
- `src/components/SectionPreviews.astro` — link "Explorar →" to `/secciones/[slug]`
- `public/i18n.js` — add translation strings for new page content
- `src/scripts/i18n.js` — keep in sync with public version

## Assets

- `public/hierba-logo.png` replaced with high-quality master wordmark (done)
- `public/hierba-ghost.png` added — light gray watermark variant for decorative use

## Design Language (match existing exactly)

- Poppins font, `--black: #111`, `--white: #fff`, `--gray-light: #e0e0e0`, `--gray-mid: #888`
- Section labels: 10px, 4px letter-spacing, uppercase, `color: #888`
- 2px solid `#111` borders between major sections
- Black tag pills: 9px, 2px letter-spacing, white text on `#111` background
- Buttons: same filled/outline pair as home page hero

## Page Layouts (approved)

**Editorial** — Two-column: narrow meta strip (issue #, date, edition) left / manifesto body right. Drop cap on opening paragraph. Horizontal rule dividers. Signature "— La Redacción".

**Secciones index** — Section label strip + 4-column grid matching existing SectionPreviews style. Each card has section number tag, name, description, article count, Explorar link.

**Section sub-pages** — Section hero (kicker + title + description) above an article grid matching existing ArticleGrid layout (featured large left, 2 small stacked right).

**Nosotros** — Section label + two-column split: left = kicker + large headline + mission body; right = 3 numbered editorial pillars.

**Contacto** — Section label + two-column split: left = headline + invitation copy; right = contact form (Nombre, Email, Asunto, Mensaje fields + submit button matching site button style).

## i18n

All new pages add ES/EN strings for: page labels, editorial meta labels, nosotros section headings, contact form labels, form placeholder text, submit button. Body copy hardcoded in ES for this prototype phase — bilingual toggle only switches labels/UI chrome.
