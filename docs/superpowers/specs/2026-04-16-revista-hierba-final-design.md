# Revista Hierba — Final Design Spec

**Date:** 2026-04-16
**Status:** Approved by Jeremy and wife
**Replaces:** `2026-04-15-revista-hierba-design.md` (dark green variant, superseded)
**Reference mockup:** `docs/editorial-mockup.html` (self-contained, logo embedded)

---

## Overview

Revista Hierba is a bilingual (Spanish-primary) online magazine dedicated to medicinal plants, cannabis, science, and human rights. The site launches as a single landing page built in Astro.

**Aesthetic:** High editorial — pure black and white. Modeled on print magazine front pages (NYT Magazine, The New Yorker). No color, no decorative accents — all contrast achieved through weight, size, and spacing.

---

## Logo

- File: `public/hierba-logo.png` (500×500 RGBA PNG, black wordmark on transparent background)
- Designer: Victoria Araya
- The PNG has ~30% whitespace padding on all sides. Compensate with negative margins:
  - Nav: `height: 175px; margin: -52px 0`
  - Hero: `height: 575px; margin: -172px auto`
  - Footer: `height: 150px; margin: -45px 0`
- Never apply color filters. Logo renders in its natural black.

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Black | `#111` | All text, borders, filled elements |
| White | `#fff` | Page background, nav, hero, cards |
| Light gray | `#e0e0e0` | Internal grid lines, image borders |
| Mid gray | `#888` | Section labels, bylines, footer links |
| Light bg | `#f5f5f5` | Subtle section backgrounds if needed |

No other colors. Tags, buttons, newsletter background — all `#111`.

---

## Typography

| Role | Font | Size / Style |
|------|------|--------------|
| Logo / masthead | `hierba-logo.png` image | See logo section |
| Nav links | Helvetica Neue, sans-serif | 11px, uppercase, 2px tracking |
| Tagline | Helvetica Neue, sans-serif | 11px, uppercase, 5px tracking, `#888` |
| Pull quote | Georgia, italic | 15px, 1.75 line-height |
| Article headlines | Georgia, bold | 22px (featured), 15px (small) |
| Article excerpt | Georgia | 13px, 1.65 line-height |
| Bylines / labels | Helvetica Neue | 10px, `#999` |
| Section headers | Helvetica Neue, black weight | 15px, uppercase, 2px tracking |
| Newsletter headline | Georgia, bold | 34px, uppercase, 5px tracking |
| Buttons | Helvetica Neue | 10px, uppercase, 3px tracking |

---

## Framework

**Astro** — static site generator, outputs plain HTML/CSS.

- Deploy target: Netlify or Vercel (free tier)
- Article content: Markdown files in `src/content/articles/` (not live at launch, structure in place)
- No client-side JS except the ES/EN language toggle

---

## Language Toggle

- ES / EN switch in the nav, right side
- Active state: black pill (`background: #111; color: #fff`)
- Inactive: plain text
- Toggle swaps all `data-i18n` attributes via a small `src/scripts/i18n.js`
- Language persisted in `localStorage`

---

## Page Structure

Single page (`index.astro`). Sections in order:

### 1. Navigation (sticky)
- Left: nav links — Editorial · Secciones · Nosotros · Contacto
- Center: logo image
- Right: ES / EN toggle
- Bottom border: `2px solid #111`
- `position: sticky; top: 0; z-index: 100; background: #fff`
- Min-height: 64px

### 2. Hero
- White background, centered layout
- Logo image (large, negative-margin cropped)
- Tagline: `CANNABIS · CIENCIA · DERECHOS HUMANOS` — small, gray, wide tracking
- Horizontal rule: 40px wide, 2px, `#111`, centered
- Pull quote (italic Georgia)
- CTAs: `LEER EDITORIAL` (filled black) + `EXPLORAR SECCIONES` (outlined)
- Bottom border: `2px solid #111`

### 3. Featured Articles Grid
- Section label: small uppercase gray, `1px #eee` bottom border
- Grid: `2fr 1fr` — large featured article left, two smaller articles stacked right
- Dividers: `2px solid #111` top/bottom of grid, `1px #e0e0e0` internal
- Featured article: 16:9 image, tag pill (black), headline (22px bold Georgia), excerpt, byline
- Small articles: 3:2 image, tag, headline (15px bold), byline
- All images: real photos via `<img>` with `object-fit: cover`, `1px #e0e0e0` border

### 4. Section Previews
- Section label: small uppercase gray
- 4-column grid, `1px #e0e0e0` dividers between columns
- Each card: section name (bold, uppercase, underlined by `2px #111`) + description + `Explorar →`
- No background colors — all white

### 5. Newsletter Signup
- Full-width, inverted: `background: #111; color: #fff`
- Headline: `SUSCRÍBETE` — 34px bold Georgia, uppercase, wide tracking
- Subhead: small uppercase sans, `#888`
- Email input (transparent bg, `1px #444` border, white text) + button (white bg, black text) side by side, max-width 420px
- Form is UI-only at launch (inline success message). Wire to Mailchimp/ConvertKit later.

### 6. Footer
- White background, `2px solid #111` top border
- 3-column: logo (left) · section links (center) · copyright (right)
- Section links: `#888`, uppercase sans

---

## Bilingual Content Map

All visible strings have ES and EN versions. `i18n.js` swaps via `data-i18n` attributes.

| Key | ES | EN |
|-----|----|----|
| nav.editorial | Editorial | Editorial |
| nav.sections | Secciones | Sections |
| nav.about | Nosotros | About |
| nav.contact | Contacto | Contact |
| hero.tagline | Cannabis · Ciencia · Derechos Humanos | Cannabis · Science · Human Rights |
| hero.quote | Hablar de cannabis es hablar... | Talking about cannabis is talking... |
| hero.cta1 | Leer Editorial | Read Editorial |
| hero.cta2 | Explorar Secciones | Explore Sections |
| featured.label | Artículos Destacados | Featured Articles |
| sections.label | Nuestras Secciones | Our Sections |
| newsletter.headline | Suscríbete | Subscribe |
| newsletter.sub | Periodismo independiente... | Independent journalism... |
| newsletter.btn | Suscribirse | Subscribe |

---

## File Structure (Astro)

```
revista-hierba/
├── src/
│   ├── pages/
│   │   └── index.astro
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Hero.astro
│   │   ├── ArticleGrid.astro
│   │   ├── SectionPreviews.astro
│   │   ├── Newsletter.astro
│   │   └── Footer.astro
│   ├── content/
│   │   └── articles/       # Empty at launch
│   ├── styles/
│   │   └── global.css
│   └── scripts/
│       └── i18n.js
├── public/
│   └── hierba-logo.png
├── astro.config.mjs
└── package.json
```

---

## Out of Scope (v1)

- Article detail pages
- CMS integration
- Search
- Authentication
- Social sharing
- Actual article images (picsum placeholders at launch)
