import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    section: z.enum(['cannabis', 'plantas', 'ciencia', 'derechos']),
    date: z.coerce.date(),
    author: z.string(),
    excerpt: z.string(),
    image: z.string(),
    photo_credit: z.string().optional(),
    tag: z.string(),
    title_en: z.string().optional(),
    excerpt_en: z.string().optional(),
    tag_en: z.string().optional(),
  }),
});

const articlesEn = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    tag: z.string(),
  }),
});

export const collections = {
  articles,
  'articles-en': articlesEn,
};
