# Revista Hierba — Design Spec

**Date:** 2026-04-15  
**Status:** Approved  
**Source:** Canva design (canva.link/s1whnuknk2b4uud) recreated and extended as a production website

---

## Overview

Revista Hierba is a bilingual (Spanish-primary) online magazine dedicated to medicinal plants, cannabis, science, and human rights. The site launches as a polished landing page built in Astro, designed to feel like a serious editorial publication — not a blog or a Canva export.

The Canva design provides the hero section as a starting point. The full site extends it with navigation, an article grid, section previews, a newsletter signup, and a footer.

---

## Aesthetic Direction

**High Editorial** — modeled on print magazine front pages (NYT Magazine, The New Yorker).

- **Color palette:** Pure black `#111`, white `#fff`, light gray `#f5f5f5`, mid gray `#888`
- **Typography:**
  - Headlines/masthead: Georgia or similar serif, bold/black weight
  - UI labels, nav, tags, bylines: Helvetica Neue or system sans-serif, uppercase, wide letter-spacing
  - Body/quotes: Georgia italic
- **Borders:** 2px solid black rules to divide major sections; 1px `#eee` for internal grid lines
- **No decorative color** — all contrast is achieved through weight, size, and spacing
- **Buttons:** Filled primary (`#111` bg, white text) + outlined secondary (transparent, `#111` border)

---

## Framework

**Astro** — static site generator. Outputs plain HTML/CSS. No client-side JS except the language toggle.

- Deploy target: Netlify or Vercel (free tier)
- Node.js required for development
- Article content: Markdown files in `src/content/` (not live at launch, but structure is in place)

---

## Language

- **Spanish primary** — all visible content defaults to Spanish
- **English toggle** — ES / EN switch in the nav; swaps text via a lightweight JS string-swap (no full i18n framework needed at this scope)
- Language state stored in `localStorage` so it persists across page loads

---

## Page Structure

Single landing page (`index.astro`). Sections in order:

### 1. Navigation (sticky)
- Left: nav links — Editorial | Secciones | Nosotros | Contacto
- Center: HIERBA wordmark (serif, bold, uppercase, large letter-spacing)
- Right: ES / EN language toggle (active state inverts bg)
- Bottom border: 2px solid black
- Behavior: sticky `top: 0`, `z-index: 100`, white background

### 2. Hero
Faithful to the Canva design with UX improvements:
- Masthead: `HIERBA` — 96px, serif, black weight, 8px letter-spacing
- Tagline: `Cannabis · Ciencia · Derechos Humanos` — 12px sans, uppercase, 4px tracking, gray
- Horizontal rule: 40px wide, 2px black, centered
- Quote (italic): *"Hablar de cannabis es hablar de derechos humanos: del derecho a la salud, a decidir sobre el propio cuerpo y a no ser criminalizados por buscar alivio y dignidad."*
- CTAs: `LEER EDITORIAL` (filled black) + `EXPLORAR SECCIONES` (outlined)
- Layout: centered, generous vertical padding (80px top, 70px bottom)

### 3. Featured Articles Grid
- Section label: `ARTÍCULOS DESTACADOS` — small uppercase sans, gray
- Grid: 2-column — large featured article (2fr) left, two smaller articles stacked (1fr) right
- Featured article: image placeholder (16:9), category tag, headline (20px bold serif), excerpt, byline
- Small articles: image placeholder (3:2), tag, headline (14px bold), byline
- Category tags: pill with black bg, white text, uppercase sans, 9px
- Separator: 2px black border top and bottom of grid

### 4. Section Previews
- Section label: `NUESTRAS SECCIONES`
- 4-column grid, each column separated by 1px `#eee` rule
- **Cannabis** — Políticas, cultura, legislación y el debate sobre regulación en América Latina y el mundo.
- **Plantas Medicinales** — Etnobotánica, medicina tradicional, y la ciencia detrás de las plantas que curan.
- **Ciencia** — Investigaciones, ensayos clínicos, y los últimos hallazgos en fitoterapia y farmacología.
- **Derechos Humanos** — El acceso a la salud, la criminalización de usuarios, y la lucha por los derechos del paciente.
- Each card: section name (bold serif, uppercase, 16px, underlined by 2px black rule) + description + `Explorar →` text link

### 5. Newsletter Signup
- Full-width, inverted (black background, white text)
- Headline: `SUSCRÍBETE` — 32px serif, uppercase, wide tracking
- Subhead: `Periodismo independiente sobre cannabis y plantas medicinales`
- Email input + `SUSCRIBIRSE` button side by side, max-width 420px, centered
- Input: dark border, transparent bg, white text, white placeholder
- Form submission: UI-only at launch (shows a success message inline). Can be wired to Mailchimp/ConvertKit as a follow-up.

### 6. Footer
- 3-column row: HIERBA wordmark (left) | section links (center) | copyright (right)
- Top border: 2px solid black
- Section links: Cannabis · Plantas · Ciencia · Derechos · Nosotros

---

## Bilingual Content Map

Every visible string has a Spanish and English version. Toggling ES/EN swaps all strings via `data-i18n` attributes and a small JS dictionary.

Key strings:

| Key | ES | EN |
|-----|----|----|
| nav.editorial | Editorial | Editorial |
| nav.sections | Secciones | Sections |
| nav.about | Nosotros | About |
| nav.contact | Contacto | Contact |
| hero.tagline | Cannabis · Ciencia · Derechos Humanos | Cannabis · Science · Human Rights |
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
│   │   └── index.astro        # Landing page
│   ├── components/
│   │   ├── Nav.astro
│   │   ├── Hero.astro
│   │   ├── ArticleGrid.astro
│   │   ├── SectionPreviews.astro
│   │   ├── Newsletter.astro
│   │   └── Footer.astro
│   ├── content/               # Empty at launch, ready for articles
│   │   └── articles/
│   ├── styles/
│   │   └── global.css
│   └── scripts/
│       └── i18n.js            # Language toggle logic
├── public/
│   └── fonts/ (if self-hosting)
├── astro.config.mjs
└── package.json
```

---

## UX Improvements Over Canva

| Canva | This Site |
|-------|-----------|
| No navigation | Sticky nav with links + language toggle |
| Hero only | Full landing page with 6 sections |
| Two passive CTAs | Primary (filled) + secondary (outlined) button hierarchy |
| No content preview | Featured article grid establishes publication feel |
| Spanish only | Bilingual ES/EN toggle |
| Not responsive | Mobile-first responsive layout |
| Static graphic | Live, deployable website |

---

## Out of Scope (v1)

- Article detail pages (Markdown content rendering)
- CMS integration
- Search
- Authentication / user accounts
- Social sharing
- Actual image assets (placeholders used at launch)
