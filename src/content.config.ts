import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { volumes } from './data/catalog';
import { syllabusItems } from './data/syllabus';

const books = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/books' }),
  schema: z.object({
    volume: z.string().refine(value => volumes.some(book => book.slug === value), 'Unknown volume'),
    order: z.number().int().min(1).max(99),
    title: z.string().min(1),
    description: z.string().min(1),
    syllabus: z.array(z.string().refine(value => value in syllabusItems, 'Unknown syllabus item')).min(1),
    completeChapters: z.array(z.number().int().min(1).max(30)).min(1),
    reviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    draft: z.boolean().default(false),
  }),
});
export const collections = { books };
