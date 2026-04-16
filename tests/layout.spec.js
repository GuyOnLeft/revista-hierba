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
