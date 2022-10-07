import axios from 'axios';
import { z } from 'zod';
import {
  pururinGetResponseSchema,
  PururinId,
  pururinIdSchema,
  pururinSearchResponseSchema,
  PururinSearchSortBy,
  pururinSearchSortTypeSchema,
} from '../../schema/pururin.schema';
import { DoujinFromSource, notionDoujin } from '../services/notion/doujin';
import { createRouter } from './context';

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

const fetcher = axios.create({
  baseURL: 'https://pururin.to',
});
type SearchDoujin = {
  query: string;
  page?: number;
  sort?: PururinSearchSortBy;
};
const searchDoujin = async ({ query, page, sort }: SearchDoujin) => {
  const response = await fetcher.post('/api/search/advance', {
    search: {
      PageNumber: page ?? 1, // configurable
      sort: sort ?? PururinSearchSortBy.NEWEST, // configurable
      manga: {
        string: query,
        sort: '1', // 1: contains with, 2: starts with
      },
      tag: { items: { whitelisted: [], blacklisted: [] }, sort: '1' },
      page: { range: [0, 1000] },
    },
  });

  const { results, status } = pururinSearchResponseSchema.parse(response.data);
  if (!status) {
    throw new Error('Pururin return status false');
  }

  return results;
};

const getDoujin = async (id: PururinId) => {
  const response = await fetcher.post('/api/contribute/gallery/info', {
    id,
    type: 2, // what is this?
  });

  const { status, gallery: doujin } = pururinGetResponseSchema.parse(
    response.data
  );

  if (!status) {
    throw new Error('Pururin return status false');
  }

  return doujin;
};
