import { defineCollection, z } from 'astro:content';

const articleSchema = z.object({
  title: z.string(),
  section: z.enum(['cannabis', 'plantas', 'ciencia', 'derechos']),
  date: z.coerce.date(),
  author: z.string(),
  excerpt: z.string(),
  image: z.string(),
  photo_credit: z.string().optional(),
  image_position: z.string().optional(),
  tag: z.string(),
  title_en: z.string().optional(),
  excerpt_en: z.string().optional(),
  tag_en: z.string().optional(),
});

const articleEnSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  tag: z.string(),
});

const articles = defineCollection({ type: 'content', schema: articleSchema });
const articlesEn = defineCollection({ type: 'content', schema: articleEnSchema });

// Unpublished drafts waiting for the editor (src/pages/borrador/[slug].astro). Same shape as articles.
const drafts = defineCollection({ type: 'content', schema: articleSchema });
const draftsEn = defineCollection({ type: 'content', schema: articleEnSchema });

export const collections = {
  articles,
  'articles-en': articlesEn,
  drafts,
  'drafts-en': draftsEn,
};
