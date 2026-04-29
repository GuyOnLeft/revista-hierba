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
    tag: z.string(),
  }),
});

export const collections = { articles };
