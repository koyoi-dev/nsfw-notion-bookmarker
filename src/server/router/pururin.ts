import { z } from 'zod';
import { env } from '../../env/server.mjs';
import { getDoujin, searchDoujin } from '../modules/pururin/api';
import {
  pururinIdSchema,
  pururinSearchSortTypeSchema,
} from '../modules/pururin/schema';
import { DoujinFromSource, NotionDoujin } from '../services/notion/doujin';
import { createRouter } from './context';

// FIXME: fix env name so its not confusing
const notionDoujin = new NotionDoujin(env.NOTION_NHENTAI_DATABASE_ID);

export const pururinRouter = createRouter()
  .query('search', {
    input: z.object({
      query: z.string(),
      sort: pururinSearchSortTypeSchema,
      cursor: z.number().min(1).default(1),
    }),
    async resolve({ input: { query, sort, cursor } }) {
      const {
        data: doujins,
        next_page_url,
        current_page,
      } = await searchDoujin({ query, page: cursor, sort });
      let nextCursor: number | undefined = undefined;
      if (next_page_url) {
        nextCursor = current_page + 1;
      }

      return {
        results: doujins,
        nextCursor,
      };
    },
  })
  .query('get', {
    input: z.object({
      id: pururinIdSchema,
    }),
    async resolve({ input: { id } }) {
      const doujin = await getDoujin(id);

      const notion = await notionDoujin.get(DoujinFromSource.PURURIN, id);

      return {
        ...doujin,
        notion,
      };
    },
  })
  .mutation('save', {
    input: z.object({
      id: pururinIdSchema,
    }),
    async resolve({ input: { id } }) {
      const doujin = await getDoujin(id);

      const notionPage = await notionDoujin.save({
        from: DoujinFromSource.PURURIN,
        id,
        title: doujin.title,
        source: doujin.source,
        thumbnail: doujin.image_url,
        authors: doujin.tags.Artist.map(({ name }) => ({ name })),
        languages: doujin.tags.Language.map(({ name }) => ({ name })),
        totalPages: doujin.total_pages,
        english: doujin.alt_title,
        japanese: doujin.j_title,
      });

      return {
        notion: notionPage,
      };
    },
  });
