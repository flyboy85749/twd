import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    order: z.number(),
    // Which pricing line on /pricing this service maps to, if any.
    pricing: z.enum(['web', 'chatbot', 'automation']).optional(),
  }),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      kind: z.string(),
      summary: z.string(),
      image: image(),
      imageAlt: z.string(),
      url: z.string().url().optional(),
      order: z.number(),
    }),
});

export const collections = { blog, services, work };
