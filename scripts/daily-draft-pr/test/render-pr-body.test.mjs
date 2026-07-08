import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderPRBody } from '../render-pr-body.mjs';

const sampleManifest = {
  date: '2026-05-13',
  excludedSlugs: ['old-slug-1', 'old-slug-2'],
  articles: [
    {
      section: 'cannabis',
      title: 'REPROCANN: 80.000 expedientes atrapados',
      slug: 'reprocann-80k-expedientes-2026',
      leadKind: 'local',
      sources: ['Info Noticias Olavarría', 'Ando Volao LATAM'],
      excerpt: 'Desde febrero de 2026, SEDRONAR aprueba en 24 horas — pero solo si...',
      imageCandidates: [
        { url: 'https://commons.wikimedia.org/c1.jpg', subject: 'Cannabis plant', license: 'CC BY 4.0', committed: true },
        { url: 'https://commons.wikimedia.org/c2.jpg', subject: 'Pharmacy', license: 'CC BY 4.0', committed: false },
        { url: 'https://commons.wikimedia.org/c3.jpg', subject: 'ANMAT building', license: 'Public domain', committed: false },
      ],
    },
  ],
  skippedSections: ['plantas'],
};

test('renderPRBody numbers articles sequentially with a gap for skipped sections', () => {
  const body = renderPRBody(sampleManifest);
  assert.match(body, /## 1\. `cannabis`/);
  assert.match(body, /⚠️ No qualifying story for plantas/);
});

test('renderPRBody marks the committed image candidate', () => {
  const body = renderPRBody(sampleManifest);
  assert.match(body, /committed pick: #1/);
});

test('renderPRBody embeds the swap instruction', () => {
  const body = renderPRBody(sampleManifest);
  assert.match(body, /use #2 on article 1/);
});

test('renderPRBody lists excluded slugs at the bottom', () => {
  const body = renderPRBody(sampleManifest);
  assert.match(body, /old-slug-1/);
  assert.match(body, /old-slug-2/);
});
