const SECTION_ORDER = ['cannabis', 'plantas', 'ciencia', 'derechos'];

function renderArticleSection(article, index) {
  const leadLabel = article.leadKind === 'local' ? 'Local lead' : `Widened to ${article.leadKind}`;
  const candidates = article.imageCandidates;
  const committedIdx = candidates.findIndex(c => c.committed);
  const committedLabel = committedIdx >= 0 ? `committed pick: #${committedIdx + 1}` : 'no image committed';
  const headers = candidates.map((c, i) => i === committedIdx ? `#${i + 1} ✅ committed` : `#${i + 1}`);
  const thumbs = candidates.map(c => `![](${c.url})`);
  const captions = candidates.map(c => `${c.subject}, [Wikimedia](${c.url}) ${c.license}`);

  return [
    `## ${index}. \`${article.section}\` — ${article.title}`,
    `**Slug:** \`${article.slug}\`  `,
    `**${leadLabel}** · Sources: ${article.sources.join(', ')}  `,
    `**Excerpt:** ${article.excerpt}`,
    '',
    `**Image candidates** (${committedLabel})`,
    `| ${headers.join(' | ')} |`,
    `|${headers.map(() => '---').join('|')}|`,
    `| ${thumbs.join(' | ')} |`,
    `| ${captions.join(' | ')} |`,
    '',
    `To swap: comment \`use #2 on article ${index}\``,
    '',
    '---',
    '',
  ].join('\n');
}

export function renderPRBody(manifest) {
  const parts = [];
  parts.push(`# Daily drafts — ${manifest.date}`);
  parts.push('');
  parts.push(`**Deploy preview:** ${manifest.deployPreviewUrl}  `);
  parts.push(`**Dedup window:** 30 days · ${manifest.excludedSlugs.length} topics excluded ([list](#dedup))`);
  parts.push('');
  parts.push('---');
  parts.push('');

  let visibleIndex = 0;
  for (const section of SECTION_ORDER) {
    const article = manifest.articles.find(a => a.section === section);
    if (article) {
      visibleIndex += 1;
      parts.push(renderArticleSection(article, visibleIndex));
    } else if (manifest.skippedSections.includes(section)) {
      parts.push(`## \`${section}\` — ⚠️ No qualifying story for ${section}`);
      parts.push('');
      parts.push('---');
      parts.push('');
    }
  }

  parts.push('<a name="dedup"></a>');
  parts.push('## Dedup excluded');
  for (const slug of manifest.excludedSlugs) {
    parts.push(`- \`${slug}\``);
  }
  return parts.join('\n');
}
