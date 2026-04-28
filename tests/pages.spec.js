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
