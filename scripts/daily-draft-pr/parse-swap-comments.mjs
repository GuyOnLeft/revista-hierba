// Article bounds (1-4) assume max 4 visible sections.
// When a section is skipped, articleIndex may exceed visibleArticleCount;
// callers must validate articleIndex <= visibleArticleCount before applying a swap.
const SWAP_PATTERN = /^\s*use\s+#([123])\s+on\s+article\s+([1-4])\s*$/i;

export function parseSwapComments(comments) {
  const byArticle = new Map();
  for (const comment of comments) {
    const lines = (comment.body || '').split('\n');
    for (const line of lines) {
      const match = line.match(SWAP_PATTERN);
      if (!match) continue;
      const candidateIndex = Number(match[1]);
      const articleIndex = Number(match[2]);
      const entry = {
        candidateIndex,
        articleIndex,
        author: comment.author?.login || 'unknown',
        createdAt: comment.createdAt,
      };
      const existing = byArticle.get(articleIndex);
      if (!existing || new Date(entry.createdAt) > new Date(existing.createdAt)) {
        byArticle.set(articleIndex, entry);
      }
    }
  }
  return [...byArticle.values()];
}
