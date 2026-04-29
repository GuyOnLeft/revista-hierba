# Revista Hierba — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved editorial black-and-white Astro landing page for Revista Hierba with a bilingual ES/EN toggle.

**Architecture:** Single Astro page (`index.astro`) composed of 6 components (Nav, Hero, ArticleGrid, SectionPreviews, Newsletter, Footer). One global CSS file with all custom properties. One vanilla JS file handles the language toggle via `data-i18n` attributes and `localStorage`.

**Tech Stack:** Astro 4.x, vanilla CSS, vanilla JS (no framework), Playwright for e2e tests.

---

## File Map

| File | Purpose |
|------|---------|
| `package.json` | Astro + Playwright deps |
| `astro.config.mjs` | Minimal Astro config |
| `public/hierba-logo.png` | Logo asset (copy from root) |
| `src/styles/global.css` | CSS reset, custom properties, global typography |
| `src/scripts/i18n.js` | Language toggle — reads `data-i18n`, swaps strings, persists to localStorage |
| `src/pages/index.astro` | Imports all components, sets `<html lang>` |
| `src/components/Nav.astro` | Sticky nav: links · logo · ES/EN toggle |
| `src/components/Hero.astro` | Logo, tagline, rule, quote, CTAs |
| `src/components/ArticleGrid.astro` | 2fr/1fr grid with 3 placeholder articles |
| `src/components/SectionPreviews.astro` | 4-column section cards |
| `src/components/Newsletter.astro` | Inverted black signup section |
| `src/components/Footer.astro` | Logo · links · copyright |
| `tests/i18n.spec.js` | Playwright: toggle switches language, persists across reload |
| `tests/layout.spec.js` | Playwright: all 6 sections render, nav is sticky |

---

## Task 1: Scaffold Astro Project

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `src/env.d.ts`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "revista-hierba",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "playwright test"
  },
  "dependencies": {
    "astro": "^4.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

- [ ] **Step 2: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({});
```

- [ ] **Step 3: Create `src/env.d.ts`**

```ts
/// <reference types="astro/client" />
```

- [ ] **Step 4: Install dependencies**

```bash
cd /Users/jeremymunson/revista-hierba && npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 5: Copy logo to public/**

```bash
cp /Users/jeremymunson/revista-hierba/hierba-logo.png /Users/jeremymunson/revista-hierba/public/hierba-logo.png
```

- [ ] **Step 6: Install Playwright browsers**

```bash
cd /Users/jeremymunson/revista-hierba && npx playwright install chromium
```

- [ ] **Step 7: Commit**

```bash
cd /Users/jeremymunson/revista-hierba && git init && git add package.json astro.config.mjs src/env.d.ts public/hierba-logo.png && git commit -m "feat: scaffold astro project"
```

---

## Task 2: Global CSS

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Write `src/styles/global.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --black:      #111;
  --white:      #fff;
  --gray-light: #e0e0e0;
  --gray-mid:   #888;
  --gray-bg:    #f5f5f5;

  --font-serif: Georgia, 'Times New Roman', serif;
  --font-sans:  'Helvetica Neue', Helvetica, Arial, sans-serif;
}

html { font-family: var(--font-serif); color: var(--black); background: var(--white); }

img { display: block; max-width: 100%; }

a { color: inherit; text-decoration: none; }
```

- [ ] **Step 2: Verify CSS is valid — no build errors**

```bash
cd /Users/jeremymunson/revista-hierba && npm run build 2>&1 | head -20
```

Expected: build succeeds (or fails only on missing index.astro — that's fine at this stage).

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css && git commit -m "feat: add global css variables and reset"
```

---

## Task 3: i18n Script + Tests

**Files:**
- Create: `src/scripts/i18n.js`
- Create: `playwright.config.js`
- Create: `tests/i18n.spec.js`

- [ ] **Step 1: Write `playwright.config.js`**

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:4321',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 2: Write failing test `tests/i18n.spec.js`**

```js
import { test, expect } from '@playwright/test';

test('ES is active by default', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('.lang-toggle [data-lang="es"]');
  await expect(toggle).toHaveClass(/active/);
});

test('clicking EN switches language', async ({ page }) => {
  await page.goto('/');
  await page.click('.lang-toggle [data-lang="en"]');
  const tagline = page.locator('[data-i18n="hero.tagline"]');
  await expect(tagline).toHaveText('Cannabis · Science · Human Rights');
});

test('language persists across reload', async ({ page }) => {
  await page.goto('/');
  await page.click('.lang-toggle [data-lang="en"]');
  await page.reload();
  const toggle = page.locator('.lang-toggle [data-lang="en"]');
  await expect(toggle).toHaveClass(/active/);
});
```

- [ ] **Step 3: Write `src/scripts/i18n.js`**

```js
const strings = {
  es: {
    'nav.editorial':        'Editorial',
    'nav.sections':         'Secciones',
    'nav.about':            'Nosotros',
    'nav.contact':          'Contacto',
    'hero.tagline':         'Cannabis · Ciencia · Derechos Humanos',
    'hero.quote':           'Hablar de cannabis es hablar de derechos humanos: del derecho a la salud, a decidir sobre el propio cuerpo y a no ser criminalizados por buscar alivio y dignidad.',
    'hero.cta1':            'Leer Editorial',
    'hero.cta2':            'Explorar Secciones',
    'featured.label':       'Artículos Destacados',
    'sections.label':       'Nuestras Secciones',
    'newsletter.headline':  'Suscríbete',
    'newsletter.sub':       'Periodismo independiente sobre cannabis y plantas medicinales',
    'newsletter.btn':       'Suscribirse',
  },
  en: {
    'nav.editorial':        'Editorial',
    'nav.sections':         'Sections',
    'nav.about':            'About',
    'nav.contact':          'Contact',
    'hero.tagline':         'Cannabis · Science · Human Rights',
    'hero.quote':           'Talking about cannabis is talking about human rights: the right to health, to decide about one\'s own body, and not to be criminalized for seeking relief and dignity.',
    'hero.cta1':            'Read Editorial',
    'hero.cta2':            'Explore Sections',
    'featured.label':       'Featured Articles',
    'sections.label':       'Our Sections',
    'newsletter.headline':  'Subscribe',
    'newsletter.sub':       'Independent journalism on cannabis and medicinal plants',
    'newsletter.btn':       'Subscribe',
  },
};

function applyLang(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (strings[lang][key]) el.textContent = strings[lang][key];
  });
  document.querySelectorAll('.lang-toggle [data-lang]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
  document.documentElement.lang = lang;
  localStorage.setItem('lang', lang);
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('lang') || 'es';
  applyLang(saved);

  document.querySelectorAll('.lang-toggle [data-lang]').forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.getAttribute('data-lang')));
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add src/scripts/i18n.js tests/i18n.spec.js playwright.config.js && git commit -m "feat: add i18n toggle script and tests"
```

---

## Task 4: Nav Component

**Files:**
- Create: `src/components/Nav.astro`

- [ ] **Step 1: Write `src/components/Nav.astro`**

```astro
---
---
<nav>
  <div class="nav-links">
    <a href="#" data-i18n="nav.editorial">Editorial</a>
    <a href="#" data-i18n="nav.sections">Secciones</a>
    <a href="#" data-i18n="nav.about">Nosotros</a>
    <a href="#" data-i18n="nav.contact">Contacto</a>
  </div>
  <div class="nav-logo">
    <img src="/hierba-logo.png" alt="Revista Hierba" />
  </div>
  <div class="lang-toggle">
    <span data-lang="es" class="active">ES</span>
    <span class="sep">/</span>
    <span data-lang="en">EN</span>
  </div>
</nav>

<style>
  nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40px;
    border-bottom: 2px solid var(--black);
    background: var(--white);
    position: sticky;
    top: 0;
    z-index: 100;
    min-height: 64px;
  }

  .nav-links {
    display: flex;
    gap: 28px;
    font-family: var(--font-sans);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .nav-links a:hover { border-bottom: 1px solid var(--black); }

  .nav-logo img {
    height: 175px;
    width: auto;
    margin: -52px 0;
    display: block;
  }

  .lang-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-sans);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .lang-toggle [data-lang] { cursor: pointer; padding: 2px 8px; }
  .lang-toggle [data-lang].active { background: var(--black); color: var(--white); }
  .lang-toggle .sep { color: #ccc; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Nav.astro && git commit -m "feat: add Nav component"
```

---

## Task 5: Hero Component

**Files:**
- Create: `src/components/Hero.astro`

- [ ] **Step 1: Write `src/components/Hero.astro`**

```astro
---
---
<section class="hero">
  <div class="hero-logo">
    <img src="/hierba-logo.png" alt="Revista Hierba" />
  </div>
  <p class="hero-tagline" data-i18n="hero.tagline">Cannabis · Ciencia · Derechos Humanos</p>
  <div class="hero-rule"></div>
  <p class="hero-quote">
    <span data-i18n="hero.quote">Hablar de cannabis es hablar de derechos humanos: del derecho a la salud, a decidir sobre el propio cuerpo y a no ser criminalizados por buscar alivio y dignidad.</span>
  </p>
  <div class="hero-ctas">
    <button class="btn-filled" data-i18n="hero.cta1">Leer Editorial</button>
    <button class="btn-outline" data-i18n="hero.cta2">Explorar Secciones</button>
  </div>
</section>

<style>
  .hero {
    background: var(--white);
    text-align: center;
    padding: 60px 40px;
    border-bottom: 2px solid var(--black);
  }

  .hero-logo img {
    height: 575px;
    width: auto;
    margin: -172px auto;
    display: block;
  }

  .hero-tagline {
    font-family: var(--font-sans);
    font-size: 11px;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: var(--gray-mid);
    margin-bottom: 24px;
  }

  .hero-rule {
    width: 40px;
    height: 2px;
    background: var(--black);
    margin: 0 auto 24px;
  }

  .hero-quote {
    font-style: italic;
    font-size: 15px;
    line-height: 1.75;
    color: #333;
    max-width: 560px;
    margin: 0 auto 36px;
  }

  .hero-ctas {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .btn-filled {
    padding: 11px 28px;
    background: var(--black);
    color: var(--white);
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid var(--black);
  }

  .btn-outline {
    padding: 11px 28px;
    background: transparent;
    color: var(--black);
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid var(--black);
  }

  .btn-filled:hover { background: #333; }
  .btn-outline:hover { background: var(--gray-bg); }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Hero.astro && git commit -m "feat: add Hero component"
```

---

## Task 6: ArticleGrid Component

**Files:**
- Create: `src/components/ArticleGrid.astro`

- [ ] **Step 1: Write `src/components/ArticleGrid.astro`**

```astro
---
---
<div class="section-label" data-i18n="featured.label">Artículos Destacados</div>
<div class="article-grid">
  <div class="article-featured">
    <div class="img-wrapper">
      <img src="https://picsum.photos/seed/herb42/800/450" alt="Cannabis medicinal" />
    </div>
    <span class="tag">Derechos Humanos</span>
    <h2 class="article-title">El cannabis medicinal y la reforma pendiente en América Latina</h2>
    <p class="article-excerpt">Una mirada a los avances legislativos en Argentina, Colombia y Uruguay, y los obstáculos que enfrentan los pacientes en el acceso a tratamientos.</p>
    <p class="article-byline">Por la Redacción · 15 Abr 2026</p>
  </div>
  <div class="article-stack">
    <div class="article-small">
      <div class="img-wrapper">
        <img src="https://picsum.photos/seed/lab77/400/267" alt="Ciencia" />
      </div>
      <span class="tag">Ciencia</span>
      <h3 class="article-title-sm">Nuevos estudios sobre cannabinoides y dolor crónico</h3>
      <p class="article-byline">14 Abr 2026</p>
    </div>
    <div class="article-small">
      <div class="img-wrapper">
        <img src="https://picsum.photos/seed/plant99/400/267" alt="Plantas medicinales" />
      </div>
      <span class="tag">Plantas Medicinales</span>
      <h3 class="article-title-sm">La valeriana y el sueño: lo que dice la evidencia</h3>
      <p class="article-byline">12 Abr 2026</p>
    </div>
  </div>
</div>

<style>
  .section-label {
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gray-mid);
    padding: 20px 40px 14px;
    border-bottom: 1px solid #eee;
    background: var(--white);
  }

  .article-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    background: var(--white);
    border-top: 2px solid var(--black);
    border-bottom: 2px solid var(--black);
  }

  .article-featured {
    padding: 32px;
    border-right: 1px solid var(--gray-light);
  }

  .img-wrapper {
    overflow: hidden;
    border: 1px solid var(--gray-light);
    margin-bottom: 18px;
  }

  .article-featured .img-wrapper { aspect-ratio: 16 / 9; }
  .article-small .img-wrapper { aspect-ratio: 3 / 2; margin-bottom: 12px; }

  .img-wrapper img { width: 100%; height: 100%; object-fit: cover; }

  .article-stack { display: flex; flex-direction: column; }

  .article-small {
    padding: 22px 24px;
    border-bottom: 1px solid var(--gray-light);
    flex: 1;
  }
  .article-small:last-child { border-bottom: none; }

  .tag {
    display: inline-block;
    font-family: var(--font-sans);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--white);
    background: var(--black);
    padding: 2px 8px;
    margin-bottom: 9px;
  }

  .article-title {
    font-size: 22px;
    font-weight: bold;
    line-height: 1.2;
    margin-bottom: 10px;
  }

  .article-title-sm {
    font-size: 15px;
    font-weight: bold;
    line-height: 1.3;
    margin-bottom: 6px;
  }

  .article-excerpt {
    font-size: 13px;
    line-height: 1.65;
    color: #444;
    margin: 8px 0 12px;
  }

  .article-byline {
    font-family: var(--font-sans);
    font-size: 10px;
    color: #999;
    letter-spacing: 1px;
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ArticleGrid.astro && git commit -m "feat: add ArticleGrid component"
```

---

## Task 7: SectionPreviews Component

**Files:**
- Create: `src/components/SectionPreviews.astro`

- [ ] **Step 1: Write `src/components/SectionPreviews.astro`**

```astro
---
---
<div class="section-label" data-i18n="sections.label">Nuestras Secciones</div>
<div class="sections-grid">
  <div class="section-card">
    <h3>Cannabis</h3>
    <p>Políticas, cultura, legislación y el debate sobre regulación en América Latina y el mundo.</p>
    <span class="section-link">Explorar →</span>
  </div>
  <div class="section-card">
    <h3>Plantas Medicinales</h3>
    <p>Etnobotánica, medicina tradicional, y la ciencia detrás de las plantas que curan.</p>
    <span class="section-link">Explorar →</span>
  </div>
  <div class="section-card">
    <h3>Ciencia</h3>
    <p>Investigaciones, ensayos clínicos, y los últimos hallazgos en fitoterapia y farmacología.</p>
    <span class="section-link">Explorar →</span>
  </div>
  <div class="section-card">
    <h3>Derechos Humanos</h3>
    <p>El acceso a la salud, la criminalización de usuarios, y la lucha por los derechos del paciente.</p>
    <span class="section-link">Explorar →</span>
  </div>
</div>

<style>
  .section-label {
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gray-mid);
    padding: 20px 40px 14px;
    border-bottom: 1px solid #eee;
    background: var(--white);
  }

  .sections-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: var(--white);
    border-bottom: 2px solid var(--black);
  }

  .section-card {
    padding: 28px 24px;
    border-right: 1px solid var(--gray-light);
  }
  .section-card:last-child { border-right: none; }

  .section-card h3 {
    font-size: 15px;
    font-weight: 900;
    font-family: var(--font-sans);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 10px;
    border-bottom: 2px solid var(--black);
    padding-bottom: 8px;
  }

  .section-card p {
    font-size: 12px;
    line-height: 1.65;
    color: #555;
    margin-bottom: 14px;
    font-family: var(--font-serif);
  }

  .section-link {
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--black);
    padding-bottom: 1px;
    cursor: pointer;
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SectionPreviews.astro && git commit -m "feat: add SectionPreviews component"
```

---

## Task 8: Newsletter Component

**Files:**
- Create: `src/components/Newsletter.astro`

- [ ] **Step 1: Write `src/components/Newsletter.astro`**

```astro
---
---
<section class="newsletter">
  <h2 data-i18n="newsletter.headline">Suscríbete</h2>
  <p data-i18n="newsletter.sub">Periodismo independiente sobre cannabis y plantas medicinales</p>
  <form class="newsletter-form" onsubmit="return false;">
    <input type="email" placeholder="tu@email.com" required />
    <button type="submit" data-i18n="newsletter.btn">Suscribirse</button>
  </form>
  <p class="success-msg" hidden>¡Gracias! Te avisamos cuando lancemos.</p>
</section>

<script>
  const form = document.querySelector('.newsletter-form');
  const success = document.querySelector('.success-msg');
  form?.addEventListener('submit', () => {
    form.hidden = true;
    success.hidden = false;
  });
</script>

<style>
  .newsletter {
    background: var(--black);
    color: var(--white);
    text-align: center;
    padding: 60px 40px;
  }

  .newsletter h2 {
    font-size: 34px;
    font-weight: bold;
    letter-spacing: 5px;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .newsletter > p {
    font-family: var(--font-sans);
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gray-mid);
    margin-bottom: 28px;
  }

  .newsletter-form {
    display: flex;
    max-width: 420px;
    margin: 0 auto;
  }

  .newsletter-form input {
    flex: 1;
    padding: 12px 16px;
    font-size: 13px;
    border: 1px solid #444;
    background: transparent;
    color: var(--white);
    font-family: var(--font-sans);
  }

  .newsletter-form input::placeholder { color: #555; }

  .newsletter-form button {
    padding: 12px 22px;
    background: var(--white);
    color: var(--black);
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    border: none;
    cursor: pointer;
    font-weight: bold;
  }

  .newsletter-form button:hover { background: #e0e0e0; }

  .success-msg {
    font-family: var(--font-sans);
    font-size: 12px;
    letter-spacing: 2px;
    color: var(--gray-mid);
    margin-top: 16px;
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Newsletter.astro && git commit -m "feat: add Newsletter component"
```

---

## Task 9: Footer Component

**Files:**
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Write `src/components/Footer.astro`**

```astro
---
---
<footer>
  <div class="footer-logo">
    <img src="/hierba-logo.png" alt="Revista Hierba" />
  </div>
  <div class="footer-links">
    <span>Cannabis</span>
    <span data-i18n="nav.sections" style="display:none"></span>
    <span>Plantas</span>
    <span>Ciencia</span>
    <span>Derechos</span>
    <span data-i18n="nav.about">Nosotros</span>
  </div>
  <div class="footer-copy">© 2026 Revista Hierba</div>
</footer>

<style>
  footer {
    background: var(--white);
    border-top: 2px solid var(--black);
    padding: 28px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-logo img {
    height: 150px;
    width: auto;
    margin: -45px 0;
    display: block;
  }

  .footer-links {
    display: flex;
    gap: 24px;
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gray-mid);
  }

  .footer-links span { cursor: pointer; }
  .footer-links span:hover { color: var(--black); }

  .footer-copy {
    font-family: var(--font-sans);
    font-size: 10px;
    color: #bbb;
    letter-spacing: 1px;
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.astro && git commit -m "feat: add Footer component"
```

---

## Task 10: Wire Up index.astro

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 1: Write `src/pages/index.astro`**

```astro
---
import Nav from '../components/Nav.astro';
import Hero from '../components/Hero.astro';
import ArticleGrid from '../components/ArticleGrid.astro';
import SectionPreviews from '../components/SectionPreviews.astro';
import Newsletter from '../components/Newsletter.astro';
import Footer from '../components/Footer.astro';
import '../styles/global.css';
---
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Revista Hierba — Periodismo independiente sobre cannabis, plantas medicinales, ciencia y derechos humanos." />
    <title>Revista Hierba</title>
  </head>
  <body>
    <Nav />
    <main>
      <Hero />
      <ArticleGrid />
      <SectionPreviews />
      <Newsletter />
    </main>
    <Footer />
    <script src="../scripts/i18n.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Start dev server and verify in browser**

```bash
cd /Users/jeremymunson/revista-hierba && npm run dev
```

Open `http://localhost:4321` — all 6 sections should be visible, logo should render, layout should match `docs/editorial-mockup.html`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro && git commit -m "feat: wire up index.astro with all components"
```

---

## Task 11: Layout Tests + Final Build

**Files:**
- Create: `tests/layout.spec.js`

- [ ] **Step 1: Write `tests/layout.spec.js`**

```js
import { test, expect } from '@playwright/test';

test('all 6 sections render', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('nav')).toBeVisible();
  await expect(page.locator('.hero')).toBeVisible();
  await expect(page.locator('.article-grid')).toBeVisible();
  await expect(page.locator('.sections-grid')).toBeVisible();
  await expect(page.locator('.newsletter')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
});

test('nav is sticky', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, 800));
  const nav = page.locator('nav');
  await expect(nav).toBeVisible();
  const box = await nav.boundingBox();
  expect(box.y).toBe(0);
});

test('logo renders in nav and hero', async ({ page }) => {
  await page.goto('/');
  const logos = page.locator('img[alt="Revista Hierba"]');
  await expect(logos).toHaveCount(3); // nav, hero, footer
});

test('newsletter form shows success on submit', async ({ page }) => {
  await page.goto('/');
  await page.fill('.newsletter-form input', 'test@example.com');
  await page.click('.newsletter-form button');
  await expect(page.locator('.success-msg')).toBeVisible();
});
```

- [ ] **Step 2: Run all tests**

```bash
cd /Users/jeremymunson/revista-hierba && npm test
```

Expected: all tests pass.

- [ ] **Step 3: Run production build**

```bash
cd /Users/jeremymunson/revista-hierba && npm run build
```

Expected: `dist/` created, no errors.

- [ ] **Step 4: Final commit**

```bash
git add tests/layout.spec.js && git commit -m "feat: add layout tests and verify production build"
```
