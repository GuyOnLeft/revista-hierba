# Revista Hierba — Missing Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 8 missing pages (Editorial, Secciones index, 4 section sub-pages, Nosotros, Contacto) so every nav link resolves, using shared Layout and SectionPage components.

**Architecture:** Create `Layout.astro` (Nav + Footer + slot) used by all new pages. The 4 section sub-pages share a `SectionPage.astro` component that accepts title/slug/description/articles props. The existing `index.astro` is untouched.

**Tech Stack:** Astro 4, Poppins (Google Fonts), Playwright for e2e tests, Netlify for deploy.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/Layout.astro` | Shared html/head/Nav/Footer/i18n wrapper |
| Create | `src/components/SectionPage.astro` | Section sub-page template (props-driven) |
| Create | `src/pages/editorial.astro` | Manifesto letter page |
| Create | `src/pages/secciones/index.astro` | 4-column section index |
| Create | `src/pages/secciones/cannabis.astro` | Cannabis section listing |
| Create | `src/pages/secciones/plantas.astro` | Plantas Medicinales listing |
| Create | `src/pages/secciones/ciencia.astro` | Ciencia listing |
| Create | `src/pages/secciones/derechos.astro` | Derechos Humanos listing |
| Create | `src/pages/nosotros.astro` | Mission + pillars page |
| Create | `src/pages/contacto.astro` | Contact form page |
| Create | `tests/pages.spec.js` | Playwright tests for all new pages |
| Modify | `src/components/Nav.astro` | Replace `href="#"` with real routes + active state |
| Modify | `src/components/SectionPreviews.astro` | Wire Explorar links to section sub-pages |
| Modify | `src/components/Hero.astro` | Wire CTA buttons to /editorial and /secciones |
| Modify | `public/i18n.js` | Add strings for all new pages |
| Modify | `src/scripts/i18n.js` | Keep in sync with public version |

---

## Task 1: Write failing Playwright tests for all new pages

**Files:**
- Create: `tests/pages.spec.js`

- [ ] **Step 1: Write the test file**

```js
import { test, expect } from '@playwright/test';

test('editorial page renders', async ({ page }) => {
  await page.goto('/editorial');
  await expect(page.locator('nav')).toBeVisible();
  await expect(page.locator('.editorial-meta')).toBeVisible();
  await expect(page.locator('.editorial-body')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
});

test('secciones index has 4 section cards', async ({ page }) => {
  await page.goto('/secciones');
  await expect(page.locator('.sections-grid .section-card')).toHaveCount(4);
});

test('section sub-pages all render', async ({ page }) => {
  for (const slug of ['cannabis', 'plantas', 'ciencia', 'derechos']) {
    await page.goto(`/secciones/${slug}`);
    await expect(page.locator('.section-hero')).toBeVisible();
    await expect(page.locator('.article-grid')).toBeVisible();
  }
});

test('nosotros page renders with 3 pillars', async ({ page }) => {
  await page.goto('/nosotros');
  await expect(page.locator('.nosotros-body')).toBeVisible();
  await expect(page.locator('.pillar')).toHaveCount(3);
});

test('contacto page renders form', async ({ page }) => {
  await page.goto('/contacto');
  await expect(page.locator('.contact-form')).toBeVisible();
  await expect(page.locator('.contact-form input')).toHaveCount(3);
  await expect(page.locator('.contact-form textarea')).toBeVisible();
});

test('nav links resolve to correct pages', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-i18n="nav.editorial"]');
  await expect(page).toHaveURL('/editorial');

  await page.goto('/');
  await page.click('[data-i18n="nav.sections"]');
  await expect(page).toHaveURL('/secciones');

  await page.goto('/');
  await page.click('[data-i18n="nav.about"]');
  await expect(page).toHaveURL('/nosotros');

  await page.goto('/');
  await page.click('[data-i18n="nav.contact"]');
  await expect(page).toHaveURL('/contacto');
});

test('explorar links on secciones index go to sub-pages', async ({ page }) => {
  await page.goto('/secciones');
  await page.locator('.section-link').first().click();
  await expect(page).toHaveURL(/\/secciones\//);
});
```

- [ ] **Step 2: Run tests to confirm they all fail (pages don't exist yet)**

```bash
cd ~/revista-hierba && npm test -- tests/pages.spec.js
```

Expected: All tests FAIL with 404 / element not found errors.

---

## Task 2: Create shared Layout.astro

**Files:**
- Create: `src/components/Layout.astro`

- [ ] **Step 1: Write the file**

```astro
---
interface Props {
  title?: string;
  description?: string;
}
const {
  title = 'Revista Hierba',
  description = 'Periodismo independiente sobre cannabis, plantas medicinales, ciencia y derechos humanos.',
} = Astro.props;
import Nav from './Nav.astro';
import Footer from './Footer.astro';
import '../styles/global.css';
---
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title} — Revista Hierba</title>
  </head>
  <body>
    <Nav />
    <main>
      <slot />
    </main>
    <Footer />
    <script is:inline src="/i18n.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
cd ~/revista-hierba && git add src/components/Layout.astro && git commit -m "feat: add shared Layout component"
```

---

## Task 3: Update Nav.astro with real routes and active state

**Files:**
- Modify: `src/components/Nav.astro`

- [ ] **Step 1: Replace nav links with real hrefs and active class**

Replace the entire `Nav.astro` file with:

```astro
---
const pathname = Astro.url.pathname;
---
<nav>
  <div class="nav-logo">
    <a href="/"><img src="/hierba-mark.png" alt="Revista Hierba" /></a>
  </div>
  <div class="nav-links">
    <a href="/editorial"
       class:list={[{ active: pathname.startsWith('/editorial') }]}
       data-i18n="nav.editorial">Editorial</a>
    <a href="/secciones"
       class:list={[{ active: pathname.startsWith('/secciones') }]}
       data-i18n="nav.sections">Secciones</a>
    <a href="/nosotros"
       class:list={[{ active: pathname.startsWith('/nosotros') }]}
       data-i18n="nav.about">Nosotros</a>
    <a href="/contacto"
       class:list={[{ active: pathname.startsWith('/contacto') }]}
       data-i18n="nav.contact">Contacto</a>
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
    align-items: flex-end;
    justify-content: flex-start;
    gap: 32px;
    padding: 0 40px 0 0;
    border-bottom: 2px solid var(--black);
    background: var(--white);
    position: sticky;
    top: 0;
    z-index: 100;
    min-height: 56px;
    padding-top: 8px;
    padding-bottom: 8px;
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
  .nav-links a.active { border-bottom: 1px solid var(--black); }
  .nav-logo {
    margin-left: 0;
  }
  .nav-logo a { display: block; }
  .nav-logo img {
    height: 74px;
    width: auto;
    margin: -16px 0;
    display: block;
    border: none;
    outline: none;
  }
  .lang-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    font-family: var(--font-sans);
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .lang-toggle [data-lang] { cursor: pointer; padding: 2px 8px; }
  .lang-toggle [data-lang].active { background: var(--black); color: var(--white); }
  .lang-toggle .sep { color: #ccc; }
  @media (max-width: 600px) {
    nav {
      gap: 12px;
      padding: 8px 16px;
    }
    .nav-links {
      display: none;
    }
    .nav-logo img {
      height: 52px;
      margin: -8px 0;
    }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
cd ~/revista-hierba && git add src/components/Nav.astro && git commit -m "feat: wire nav links to real routes with active state"
```

---

## Task 4: Update public/i18n.js and src/scripts/i18n.js with new strings

**Files:**
- Modify: `public/i18n.js`
- Modify: `src/scripts/i18n.js`

- [ ] **Step 1: Replace both files with expanded strings**

The new content for BOTH `public/i18n.js` AND `src/scripts/i18n.js` is identical:

```js
const strings = {
  es: {
    'nav.editorial':           'Editorial',
    'nav.sections':            'Secciones',
    'nav.about':               'Nosotros',
    'nav.contact':             'Contacto',
    'hero.tagline':            'Cannabis · Ciencia · Derechos Humanos',
    'hero.quote':              'Hablar de cannabis es hablar de derechos humanos: del derecho a la salud, a decidir sobre el propio cuerpo y a no ser criminalizados por buscar alivio y dignidad.',
    'hero.cta1':               'Leer Editorial',
    'hero.cta2':               'Explorar Secciones',
    'featured.label':          'Artículos Destacados',
    'sections.label':          'Nuestras Secciones',
    'newsletter.headline':     'Suscríbete',
    'newsletter.sub':          'Periodismo independiente sobre cannabis y plantas medicinales',
    'newsletter.btn':          'Suscribirse',
    'editorial.label':         'Editorial',
    'editorial.numero':        'Número',
    'editorial.fecha':         'Fecha',
    'editorial.edicion':       'Edición',
    'editorial.title':         'Carta a los Lectores',
    'editorial.firma':         '— La Redacción',
    'secciones.label':         'Nuestras Secciones',
    'secciones.articulos':     'Artículos',
    'nosotros.label':          'Nosotros',
    'nosotros.quienes':        'Quiénes somos',
    'nosotros.principios':     'Nuestros principios',
    'nosotros.p01.name':       'Independencia editorial',
    'nosotros.p02.name':       'Rigor científico',
    'nosotros.p03.name':       'Derechos humanos',
    'contacto.label':          'Contacto',
    'contacto.escribinos':     'Escribinos',
    'contacto.nombre':         'Nombre',
    'contacto.email':          'Email',
    'contacto.asunto':         'Asunto',
    'contacto.mensaje':        'Mensaje',
    'contacto.enviar':         'Enviar →',
  },
  en: {
    'nav.editorial':           'Editorial',
    'nav.sections':            'Sections',
    'nav.about':               'About',
    'nav.contact':             'Contact',
    'hero.tagline':            'Cannabis · Science · Human Rights',
    'hero.quote':              "Talking about cannabis is talking about human rights: the right to health, to decide about one's own body, and not to be criminalized for seeking relief and dignity.",
    'hero.cta1':               'Read Editorial',
    'hero.cta2':               'Explore Sections',
    'featured.label':          'Featured Articles',
    'sections.label':          'Our Sections',
    'newsletter.headline':     'Subscribe',
    'newsletter.sub':          'Independent journalism on cannabis and medicinal plants',
    'newsletter.btn':          'Subscribe',
    'editorial.label':         'Editorial',
    'editorial.numero':        'Issue',
    'editorial.fecha':         'Date',
    'editorial.edicion':       'Edition',
    'editorial.title':         'Letter to Our Readers',
    'editorial.firma':         '— The Editorial Team',
    'secciones.label':         'Our Sections',
    'secciones.articulos':     'Articles',
    'nosotros.label':          'About',
    'nosotros.quienes':        'Who we are',
    'nosotros.principios':     'Our principles',
    'nosotros.p01.name':       'Editorial independence',
    'nosotros.p02.name':       'Scientific rigor',
    'nosotros.p03.name':       'Human rights',
    'contacto.label':          'Contact',
    'contacto.escribinos':     'Write to us',
    'contacto.nombre':         'Name',
    'contacto.email':          'Email',
    'contacto.asunto':         'Subject',
    'contacto.mensaje':        'Message',
    'contacto.enviar':         'Send →',
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

- [ ] **Step 2: Commit**

```bash
cd ~/revista-hierba && git add public/i18n.js src/scripts/i18n.js && git commit -m "feat: add i18n strings for all new pages"
```

---

## Task 5: Create editorial.astro

**Files:**
- Create: `src/pages/editorial.astro`

- [ ] **Step 1: Write the file**

```astro
---
import Layout from '../components/Layout.astro';
---
<Layout title="Editorial" description="Carta a los lectores de Revista Hierba.">
  <div class="section-label" data-i18n="editorial.label">Editorial</div>
  <div class="editorial-layout">
    <div class="editorial-meta">
      <div class="meta-item">
        <div class="meta-label" data-i18n="editorial.numero">Número</div>
        <div class="meta-value meta-value--big">001</div>
      </div>
      <div class="meta-item">
        <div class="meta-label" data-i18n="editorial.fecha">Fecha</div>
        <div class="meta-value">Abril 2026</div>
      </div>
      <div class="meta-item">
        <div class="meta-label" data-i18n="editorial.edicion">Edición</div>
        <div class="meta-value">Fundación</div>
      </div>
    </div>
    <div class="editorial-body">
      <h1 class="editorial-title" data-i18n="editorial.title">Carta a los Lectores</h1>
      <div class="editorial-rule"></div>
      <p class="lead drop-cap">Revista Hierba nace de una convicción simple: hablar de cannabis es hablar de derechos humanos.</p>
      <p>No existe otra planta que concentre tantas batallas simultáneas — la batalla por el acceso a la salud, por el derecho a decidir sobre el propio cuerpo, por la dignidad de quienes han sido criminalizados por buscar alivio.</p>
      <div class="editorial-rule"></div>
      <p>Vamos a publicar periodismo independiente, riguroso y comprometido con las comunidades que más lo necesitan: pacientes, investigadores, activistas, pueblos originarios cuyos conocimientos botánicos han sido ignorados o apropiados sin reconocimiento.</p>
      <p>Creemos en la ciencia. Creemos en los saberes tradicionales. Creemos que ambas tradiciones tienen más para enseñarse mutuamente de lo que los sistemas actuales permiten.</p>
      <div class="editorial-rule"></div>
      <p>Bienvenidos a Revista Hierba.</p>
      <p class="editorial-signature" data-i18n="editorial.firma">— La Redacción</p>
    </div>
  </div>
</Layout>

<style>
  .section-label {
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gray-mid);
    padding: 20px 40px 14px;
    border-bottom: 1px solid #eee;
  }
  .editorial-layout {
    display: grid;
    grid-template-columns: 180px 1fr;
    border-top: 2px solid var(--black);
    border-bottom: 2px solid var(--black);
  }
  .editorial-meta {
    padding: 36px 28px;
    border-right: 1px solid var(--gray-light);
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .meta-label {
    font-family: var(--font-sans);
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gray-mid);
    margin-bottom: 4px;
  }
  .meta-value {
    font-size: 14px;
    font-weight: 700;
  }
  .meta-value--big {
    font-size: 28px;
    font-weight: 900;
  }
  .editorial-body {
    padding: 36px 48px;
  }
  .editorial-title {
    font-size: 36px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -1px;
    margin-bottom: 20px;
  }
  .editorial-rule {
    width: 40px;
    height: 2px;
    background: var(--black);
    margin: 20px 0;
  }
  .editorial-body p {
    font-size: 15px;
    line-height: 1.8;
    color: #333;
    margin-bottom: 16px;
    font-family: var(--font-serif);
  }
  .lead { font-size: 17px; font-weight: 500; color: var(--black); }
  .drop-cap::first-letter {
    float: left;
    font-size: 64px;
    font-weight: 900;
    line-height: 0.82;
    margin-right: 10px;
    margin-top: 6px;
  }
  .editorial-signature {
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gray-mid);
    margin-top: 12px;
  }
  @media (max-width: 600px) {
    .editorial-layout { grid-template-columns: 1fr; }
    .editorial-meta { border-right: none; border-bottom: 1px solid var(--gray-light); }
    .editorial-body { padding: 24px 20px; }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
cd ~/revista-hierba && git add src/pages/editorial.astro && git commit -m "feat: add editorial page"
```

---

## Task 6: Create secciones/index.astro

**Files:**
- Create: `src/pages/secciones/index.astro`

- [ ] **Step 1: Write the file**

```astro
---
import Layout from '../../components/Layout.astro';
---
<Layout title="Secciones" description="Las secciones de Revista Hierba: Cannabis, Plantas Medicinales, Ciencia y Derechos Humanos.">
  <div class="section-label" data-i18n="secciones.label">Nuestras Secciones</div>
  <div class="sections-grid">
    <div class="section-card">
      <h3>Cannabis</h3>
      <p>Políticas, cultura, legislación y el debate sobre regulación en América Latina y el mundo.</p>
      <a href="/secciones/cannabis" class="section-link">Explorar →</a>
    </div>
    <div class="section-card">
      <h3>Plantas Medicinales</h3>
      <p>Etnobotánica, medicina tradicional, y la ciencia detrás de las plantas que curan.</p>
      <a href="/secciones/plantas" class="section-link">Explorar →</a>
    </div>
    <div class="section-card">
      <h3>Ciencia</h3>
      <p>Investigaciones, ensayos clínicos, y los últimos hallazgos en fitoterapia y farmacología.</p>
      <a href="/secciones/ciencia" class="section-link">Explorar →</a>
    </div>
    <div class="section-card">
      <h3>Derechos Humanos</h3>
      <p>El acceso a la salud, la criminalización de usuarios, y la lucha por los derechos del paciente.</p>
      <a href="/secciones/derechos" class="section-link">Explorar →</a>
    </div>
  </div>
</Layout>

<style>
  .section-label {
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gray-mid);
    padding: 20px 40px 14px;
    border-bottom: 1px solid #eee;
  }
  .sections-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: var(--white);
    border-top: 2px solid var(--black);
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
    display: inline-block;
  }
  @media (max-width: 700px) {
    .sections-grid { grid-template-columns: repeat(2, 1fr); }
    .section-card:nth-child(2) { border-right: none; }
    .section-card:nth-child(3) { border-right: 1px solid var(--gray-light); }
  }
  @media (max-width: 400px) {
    .sections-grid { grid-template-columns: 1fr; }
    .section-card { border-right: none; border-bottom: 1px solid var(--gray-light); }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
cd ~/revista-hierba && git add src/pages/secciones/index.astro && git commit -m "feat: add secciones index page"
```

---

## Task 7: Create SectionPage.astro component and 4 section sub-pages

**Files:**
- Create: `src/components/SectionPage.astro`
- Create: `src/pages/secciones/cannabis.astro`
- Create: `src/pages/secciones/plantas.astro`
- Create: `src/pages/secciones/ciencia.astro`
- Create: `src/pages/secciones/derechos.astro`

- [ ] **Step 1: Write SectionPage.astro**

```astro
---
interface Article {
  tag: string;
  title: string;
  excerpt: string;
  byline: string;
  img: string;
}
interface Props {
  section: string;
  description: string;
  articles: Article[];
}
const { section, description, articles } = Astro.props;
const [featured, ...rest] = articles;
import Layout from './Layout.astro';
---
<Layout title={section} description={description}>
  <div class="section-hero">
    <div class="section-hero-kicker" data-i18n="nav.sections">Secciones</div>
    <h1 class="section-hero-title">{section}</h1>
    <p class="section-hero-desc">{description}</p>
  </div>
  <div class="section-label" data-i18n="secciones.articulos">Artículos</div>
  <div class="article-grid">
    <div class="article-featured">
      <div class="img-wrapper">
        <img src={featured.img} alt={featured.title} />
      </div>
      <span class="tag">{featured.tag}</span>
      <h2 class="article-title">{featured.title}</h2>
      <p class="article-excerpt">{featured.excerpt}</p>
      <p class="article-byline">{featured.byline}</p>
    </div>
    <div class="article-stack">
      {rest.map(article => (
        <div class="article-small">
          <div class="img-wrapper">
            <img src={article.img} alt={article.title} />
          </div>
          <span class="tag">{article.tag}</span>
          <h3 class="article-title-sm">{article.title}</h3>
          <p class="article-byline">{article.byline}</p>
        </div>
      ))}
    </div>
  </div>
</Layout>

<style>
  .section-hero {
    padding: 40px 40px 36px;
    border-bottom: 2px solid var(--black);
  }
  .section-hero-kicker {
    font-family: var(--font-sans);
    font-size: 9px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gray-mid);
    margin-bottom: 10px;
  }
  .section-hero-title {
    font-size: 42px;
    font-weight: 900;
    letter-spacing: -1px;
    line-height: 1.05;
    margin-bottom: 12px;
  }
  .section-hero-desc {
    font-size: 14px;
    color: #555;
    line-height: 1.65;
    max-width: 540px;
    font-family: var(--font-serif);
  }
  .section-label {
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gray-mid);
    padding: 20px 40px 14px;
    border-bottom: 1px solid #eee;
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
    font-family: var(--font-serif);
  }
  .article-byline {
    font-family: var(--font-sans);
    font-size: 10px;
    color: #999;
    letter-spacing: 1px;
  }
  @media (max-width: 700px) {
    .article-grid { grid-template-columns: 1fr; }
    .article-featured { border-right: none; border-bottom: 1px solid var(--gray-light); }
  }
</style>
```

- [ ] **Step 2: Write cannabis.astro**

```astro
---
import SectionPage from '../../components/SectionPage.astro';
const articles = [
  {
    tag: 'Cannabis',
    title: 'El cannabis medicinal y la reforma pendiente en América Latina',
    excerpt: 'Una mirada a los avances legislativos en Argentina, Colombia y Uruguay, y los obstáculos que enfrentan los pacientes en el acceso a tratamientos.',
    byline: 'Por la Redacción · 15 Abr 2026',
    img: 'https://picsum.photos/seed/herb42/800/450',
  },
  {
    tag: 'Cannabis',
    title: 'Regulación y mercado: qué aprender de Uruguay',
    excerpt: 'Diez años de regulación uruguaya y sus efectos en el consumo y la salud pública.',
    byline: 'Por la Redacción · 10 Abr 2026',
    img: 'https://picsum.photos/seed/herb99/400/267',
  },
  {
    tag: 'Cannabis',
    title: 'Cultivo doméstico: derechos y límites legales',
    excerpt: 'El estado legal del autocultivo en distintos países de América Latina.',
    byline: 'Por la Redacción · 5 Abr 2026',
    img: 'https://picsum.photos/seed/herb55/400/267',
  },
];
---
<SectionPage
  section="Cannabis"
  description="Políticas, cultura, legislación y el debate sobre regulación en América Latina y el mundo."
  articles={articles}
/>
```

- [ ] **Step 3: Write plantas.astro**

```astro
---
import SectionPage from '../../components/SectionPage.astro';
const articles = [
  {
    tag: 'Plantas Medicinales',
    title: 'La valeriana y el sueño: lo que dice la evidencia',
    excerpt: 'Un repaso por los estudios clínicos más recientes sobre el uso de valeriana como inductora del sueño.',
    byline: 'Por la Redacción · 12 Abr 2026',
    img: 'https://picsum.photos/seed/plant99/800/450',
  },
  {
    tag: 'Plantas Medicinales',
    title: 'Ashwagandha: adaptógeno y tradición ayurvédica',
    excerpt: 'La historia y la ciencia detrás de una de las plantas medicinales más estudiadas del mundo.',
    byline: 'Por la Redacción · 8 Abr 2026',
    img: 'https://picsum.photos/seed/plant55/400/267',
  },
  {
    tag: 'Plantas Medicinales',
    title: 'Cúrcuma: más allá del marketing',
    excerpt: 'Separar la evidencia del ruido en torno a uno de los suplementos más vendidos del mundo.',
    byline: 'Por la Redacción · 3 Abr 2026',
    img: 'https://picsum.photos/seed/plant22/400/267',
  },
];
---
<SectionPage
  section="Plantas Medicinales"
  description="Etnobotánica, medicina tradicional, y la ciencia detrás de las plantas que curan."
  articles={articles}
/>
```

- [ ] **Step 4: Write ciencia.astro**

```astro
---
import SectionPage from '../../components/SectionPage.astro';
const articles = [
  {
    tag: 'Ciencia',
    title: 'Nuevos estudios sobre cannabinoides y dolor crónico',
    excerpt: 'Un análisis de los ensayos clínicos más recientes y sus implicancias para el tratamiento del dolor.',
    byline: 'Por la Redacción · 14 Abr 2026',
    img: 'https://picsum.photos/seed/lab77/800/450',
  },
  {
    tag: 'Ciencia',
    title: 'El sistema endocannabinoide: 30 años de investigación',
    excerpt: 'Desde su descubrimiento en 1992 hasta hoy: lo que sabemos y lo que queda por entender.',
    byline: 'Por la Redacción · 9 Abr 2026',
    img: 'https://picsum.photos/seed/lab33/400/267',
  },
  {
    tag: 'Ciencia',
    title: 'CBD vs THC: guía para no perderse',
    excerpt: 'Las diferencias farmacológicas, los usos clínicos y el estado de la evidencia para cada compuesto.',
    byline: 'Por la Redacción · 4 Abr 2026',
    img: 'https://picsum.photos/seed/lab11/400/267',
  },
];
---
<SectionPage
  section="Ciencia"
  description="Investigaciones, ensayos clínicos, y los últimos hallazgos en fitoterapia y farmacología."
  articles={articles}
/>
```

- [ ] **Step 5: Write derechos.astro**

```astro
---
import SectionPage from '../../components/SectionPage.astro';
const articles = [
  {
    tag: 'Derechos Humanos',
    title: 'Criminalización y acceso: el doble estándar del sistema de salud',
    excerpt: 'Cómo el marco legal penaliza el consumo mientras el sistema médico lo ignora como opción terapéutica.',
    byline: 'Por la Redacción · 13 Abr 2026',
    img: 'https://picsum.photos/seed/rights42/800/450',
  },
  {
    tag: 'Derechos Humanos',
    title: 'Mujeres y cannabis: invisibilizadas por la investigación',
    excerpt: 'La mayoría de los ensayos clínicos excluyen a mujeres. Las consecuencias son concretas y urgentes.',
    byline: 'Por la Redacción · 7 Abr 2026',
    img: 'https://picsum.photos/seed/rights77/400/267',
  },
  {
    tag: 'Derechos Humanos',
    title: 'Pueblos originarios y conocimiento botánico: una deuda pendiente',
    excerpt: 'La apropiación de saberes tradicionales sin reconocimiento ni compensación para las comunidades de origen.',
    byline: 'Por la Redacción · 2 Abr 2026',
    img: 'https://picsum.photos/seed/rights11/400/267',
  },
];
---
<SectionPage
  section="Derechos Humanos"
  description="El acceso a la salud, la criminalización de usuarios, y la lucha por los derechos del paciente."
  articles={articles}
/>
```

- [ ] **Step 6: Commit all**

```bash
cd ~/revista-hierba && git add src/components/SectionPage.astro src/pages/secciones/ && git commit -m "feat: add SectionPage component and 4 section sub-pages"
```

---

## Task 8: Create nosotros.astro

**Files:**
- Create: `src/pages/nosotros.astro`

- [ ] **Step 1: Write the file**

```astro
---
import Layout from '../components/Layout.astro';
---
<Layout title="Nosotros" description="Quiénes somos y en qué creemos en Revista Hierba.">
  <div class="section-label" data-i18n="nosotros.label">Nosotros</div>
  <div class="nosotros-body">
    <div class="nos-left">
      <div class="nos-kicker" data-i18n="nosotros.quienes">Quiénes somos</div>
      <h1 class="nos-headline">Periodismo<br>independiente<br>desde 2026</h1>
      <p>Revista Hierba es una publicación bilingüe dedicada al periodismo independiente sobre cannabis, plantas medicinales, ciencia y derechos humanos.</p>
      <p>Nacemos convencidos de que el acceso a la información es un derecho, no un privilegio. Trabajamos desde América Latina con una perspectiva global, priorizando las voces de comunidades históricamente ignoradas por los medios tradicionales.</p>
      <p>No tenemos financiamiento de la industria. No tenemos línea editorial impuesta por anunciantes. Tenemos una convicción.</p>
    </div>
    <div class="nos-right">
      <div class="nos-kicker" data-i18n="nosotros.principios">Nuestros principios</div>
      <div class="nos-pillars">
        <div class="pillar">
          <div class="pillar-num">01</div>
          <div class="pillar-name" data-i18n="nosotros.p01.name">Independencia editorial</div>
          <div class="pillar-desc">Sin financiamiento de la industria, sin línea editorial impuesta por anunciantes. Nuestra única obligación es con la verdad y con nuestros lectores.</div>
        </div>
        <div class="pillar">
          <div class="pillar-num">02</div>
          <div class="pillar-name" data-i18n="nosotros.p02.name">Rigor científico</div>
          <div class="pillar-desc">Citamos fuentes. Distinguimos evidencia de opinión. No publicamos desinformación, aunque incomode a la industria o a los prohibicionistas.</div>
        </div>
        <div class="pillar">
          <div class="pillar-num">03</div>
          <div class="pillar-name" data-i18n="nosotros.p03.name">Derechos humanos</div>
          <div class="pillar-desc">El eje de toda nuestra cobertura es la dignidad de las personas, no el mercado. El acceso a la salud es un derecho, no un privilegio.</div>
        </div>
      </div>
    </div>
  </div>
</Layout>

<style>
  .section-label {
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gray-mid);
    padding: 20px 40px 14px;
    border-bottom: 1px solid #eee;
  }
  .nosotros-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-top: 2px solid var(--black);
    border-bottom: 2px solid var(--black);
  }
  .nos-left {
    padding: 40px;
    border-right: 1px solid var(--gray-light);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .nos-right {
    padding: 40px;
  }
  .nos-kicker {
    font-family: var(--font-sans);
    font-size: 9px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gray-mid);
    margin-bottom: 16px;
  }
  .nos-headline {
    font-size: 32px;
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
  }
  .nos-left p {
    font-size: 13px;
    line-height: 1.8;
    color: #333;
    font-family: var(--font-serif);
  }
  .nos-pillars {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .pillar {
    border-top: 1px solid var(--gray-light);
    padding: 20px 0;
  }
  .pillar:first-child { border-top: none; padding-top: 0; }
  .pillar-num {
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gray-mid);
    margin-bottom: 4px;
  }
  .pillar-name {
    font-size: 14px;
    font-weight: 700;
    font-family: var(--font-sans);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .pillar-desc {
    font-size: 12px;
    color: #555;
    line-height: 1.65;
    font-family: var(--font-serif);
  }
  @media (max-width: 700px) {
    .nosotros-body { grid-template-columns: 1fr; }
    .nos-left { border-right: none; border-bottom: 1px solid var(--gray-light); }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
cd ~/revista-hierba && git add src/pages/nosotros.astro && git commit -m "feat: add nosotros page"
```

---

## Task 9: Create contacto.astro

**Files:**
- Create: `src/pages/contacto.astro`

- [ ] **Step 1: Write the file**

```astro
---
import Layout from '../components/Layout.astro';
---
<Layout title="Contacto" description="Escribinos a Revista Hierba.">
  <div class="section-label" data-i18n="contacto.label">Contacto</div>
  <div class="contacto-body">
    <div class="contact-intro">
      <div class="intro-kicker" data-i18n="contacto.escribinos">Escribinos</div>
      <h1 class="intro-headline">¿Tenés una historia,<br>una pregunta o<br>una colaboración?</h1>
      <p>Estamos abiertos a escuchar a investigadores, pacientes, activistas y periodistas que quieran contribuir o comunicarse con la redacción.</p>
    </div>
    <div class="contact-form">
      <div class="form-group">
        <label class="form-label" data-i18n="contacto.nombre">Nombre</label>
        <input class="form-input" type="text" name="nombre" placeholder="Tu nombre" required />
      </div>
      <div class="form-group">
        <label class="form-label" data-i18n="contacto.email">Email</label>
        <input class="form-input" type="email" name="email" placeholder="tu@email.com" required />
      </div>
      <div class="form-group">
        <label class="form-label" data-i18n="contacto.asunto">Asunto</label>
        <input class="form-input" type="text" name="asunto" placeholder="¿De qué se trata?" required />
      </div>
      <div class="form-group">
        <label class="form-label" data-i18n="contacto.mensaje">Mensaje</label>
        <textarea class="form-input" name="mensaje" rows="5" placeholder="Tu mensaje..." required></textarea>
      </div>
      <button class="btn-filled" type="submit" data-i18n="contacto.enviar">Enviar →</button>
    </div>
  </div>
</Layout>

<style>
  .section-label {
    font-family: var(--font-sans);
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gray-mid);
    padding: 20px 40px 14px;
    border-bottom: 1px solid #eee;
  }
  .contacto-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-top: 2px solid var(--black);
    border-bottom: 2px solid var(--black);
  }
  .contact-intro {
    padding: 40px;
    border-right: 1px solid var(--gray-light);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .intro-kicker {
    font-family: var(--font-sans);
    font-size: 9px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gray-mid);
  }
  .intro-headline {
    font-size: 28px;
    font-weight: 900;
    line-height: 1.2;
    letter-spacing: -0.5px;
  }
  .contact-intro p {
    font-size: 13px;
    line-height: 1.8;
    color: #555;
    font-family: var(--font-serif);
  }
  .contact-form {
    padding: 40px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-label {
    font-family: var(--font-sans);
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gray-mid);
  }
  .form-input {
    border: 1px solid var(--gray-light);
    padding: 10px 12px;
    font-size: 13px;
    font-family: var(--font-serif);
    outline: none;
    transition: border-color 0.15s;
    background: var(--white);
  }
  .form-input:focus { border-color: var(--black); }
  textarea.form-input { resize: vertical; }
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
    align-self: flex-start;
  }
  .btn-filled:hover { background: #333; }
  @media (max-width: 700px) {
    .contacto-body { grid-template-columns: 1fr; }
    .contact-intro { border-right: none; border-bottom: 1px solid var(--gray-light); }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
cd ~/revista-hierba && git add src/pages/contacto.astro && git commit -m "feat: add contacto page"
```

---

## Task 10: Wire up SectionPreviews and Hero CTAs with real links

**Files:**
- Modify: `src/components/SectionPreviews.astro`
- Modify: `src/components/Hero.astro`

- [ ] **Step 1: Update SectionPreviews.astro — change spans to anchor tags**

Replace only the four `<span class="section-link">Explorar →</span>` lines with anchor tags:

In `src/components/SectionPreviews.astro`, replace:
```html
<span class="section-link">Explorar →</span>
```
with the appropriate href for each card, in order:
- Card 1 (Cannabis): `<a href="/secciones/cannabis" class="section-link">Explorar →</a>`
- Card 2 (Plantas Medicinales): `<a href="/secciones/plantas" class="section-link">Explorar →</a>`
- Card 3 (Ciencia): `<a href="/secciones/ciencia" class="section-link">Explorar →</a>`
- Card 4 (Derechos Humanos): `<a href="/secciones/derechos" class="section-link">Explorar →</a>`

- [ ] **Step 2: Update Hero.astro — change buttons to links**

Replace the two `<button>` elements in `src/components/Hero.astro`:
```html
<div class="hero-ctas">
  <a href="/editorial" class="btn-filled" data-i18n="hero.cta1">Leer Editorial</a>
  <a href="/secciones" class="btn-outline" data-i18n="hero.cta2">Explorar Secciones</a>
</div>
```

Also add display styles so the anchor tags look like the original buttons. In the `<style>` block, add:
```css
.btn-filled, .btn-outline { display: inline-block; text-align: center; }
```

- [ ] **Step 3: Commit**

```bash
cd ~/revista-hierba && git add src/components/SectionPreviews.astro src/components/Hero.astro && git commit -m "feat: wire home page CTAs and section links to real routes"
```

---

## Task 11: Run full test suite and verify all tests pass

- [ ] **Step 1: Run existing tests**

```bash
cd ~/revista-hierba && npm test
```

Expected: All tests in `tests/layout.spec.js`, `tests/i18n.spec.js`, and `tests/pages.spec.js` PASS.

If `layout.spec.js` test `'logo renders in nav and hero'` fails (expects 3 logos), check that `hierba-logo.png` is still referenced in both Hero and Footer. The nav uses `hierba-mark.png` (the "h" icon), not `hierba-logo.png`.

- [ ] **Step 2: Confirm all 4 nav links resolve in browser**

Run dev server: `cd ~/revista-hierba && npm run dev`
Open `http://localhost:4321` and click Editorial, Secciones, Nosotros, Contacto — all should resolve.

- [ ] **Step 3: Commit test file if not already committed**

```bash
cd ~/revista-hierba && git add tests/pages.spec.js && git commit -m "test: add Playwright tests for all new pages"
```

---

## Task 12: Build and deploy to Netlify

- [ ] **Step 1: Run production build**

```bash
cd ~/revista-hierba && npm run build
```

Expected: Build completes with no errors. Output in `dist/`.

- [ ] **Step 2: Deploy to Netlify**

```bash
cd ~/revista-hierba && npx netlify deploy --prod
```

Expected: Deploy succeeds. Confirm live URL: https://enchanting-flan-5c547a.netlify.app

- [ ] **Step 3: Verify all pages live**

Visit each URL and confirm it loads:
- https://enchanting-flan-5c547a.netlify.app/editorial
- https://enchanting-flan-5c547a.netlify.app/secciones
- https://enchanting-flan-5c547a.netlify.app/secciones/cannabis
- https://enchanting-flan-5c547a.netlify.app/secciones/plantas
- https://enchanting-flan-5c547a.netlify.app/secciones/ciencia
- https://enchanting-flan-5c547a.netlify.app/secciones/derechos
- https://enchanting-flan-5c547a.netlify.app/nosotros
- https://enchanting-flan-5c547a.netlify.app/contacto
