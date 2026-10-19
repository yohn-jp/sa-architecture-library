import { getCollection, type CollectionEntry } from 'astro:content';
export const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
export const chapterNumber = (order: number) => String(order).padStart(2, '0');
export const chapterUrl = (entry: CollectionEntry<'books'>) =>
  `${base}books/${entry.data.volume}/${chapterNumber(entry.data.order)}/`;

export async function publishedChapters() {
  const entries = await getCollection('books', ({ data }) => !data.draft);
  const seen = new Set<string>();
  for (const entry of entries) {
    const stableId = `${entry.data.volume}/${chapterNumber(entry.data.order)}`;
    if (entry.id !== stableId || seen.has(stableId)) {
      throw new Error(`Chapter identity must match its stable file path: ${entry.id}`);
    }
    seen.add(stableId);
  }
  return entries.sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
}
