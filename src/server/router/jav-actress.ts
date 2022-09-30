import { z } from 'zod';
import { env } from '../../env/server.mjs';
import { getActress, getAllActress } from '../services/fetcher/jav-actress';
import { JavActressService } from '../services/notion/jav-actress';
import { createRouter } from './context';

const notionJavActress = new JavActressService(
  env.NOTION_JAVACTRESS_DATABASE_ID
);

export const javActressRouter = createRouter()
  .query('search', {
    input: z.object({
      query: z.string(),
      cursor: z.number().min(1).default(1),
      limit: z.number().min(1).max(20).default(20),
    }),
    async resolve({ input: { query, cursor, limit } }) {
      const { data: actresses, meta } = await getAllActress({
        limit,
        query,
        page: cursor,
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (meta.filter_count > cursor * limit) {
        nextCursor = cursor + 1;
      }

      return {
        results: actresses,
        nextCursor,
      };
    },
  })
  .query('get', {
    input: z.object({
      slug: z.string(),
    }),
    async resolve({ input: { slug } }) {
      const actress = await getActress(slug);

      const notionActress = await notionJavActress.get(slug);

      return {
        ...actress,
        notion: notionActress,
      };
    },
  })
  .mutation('save', {
    input: z.object({
      slug: z.string(),
    }),
    async resolve({ input: { slug } }) {
      const actress = await getActress(slug);

      const notionActress = await notionJavActress.save({
        slug: actress.slug,
        name: actress.name,
        japanese: actress.japanese,
        thumbnail: actress.thumbnail,
        bio: actress.bio || '',
        birthdate: actress.birthdate || '',
        height: actress.height,
        cup: actress.cup ? { name: actress.cup } : null,
        bust: actress.bust,
        waist: actress.waist,
        hip: actress.hip,
        categories: (actress.categories ?? []).map((v) => ({ name: v })),
        instagram: actress.instagram?.url || null,
        twitter: actress.twitter?.url || null,
      });

      return {
        notion: notionActress,
      };
    },
  });
