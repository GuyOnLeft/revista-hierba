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
