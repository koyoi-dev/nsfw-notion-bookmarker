import axios from 'axios';
import { select } from 'radash';
import { z } from 'zod';
import { env } from '../../env/server.mjs';
import {
  Doujin,
  doujinIdSchema,
  NhentaiSortBy,
  nhentaiSortBySchema,
  NHENTAI_SORT_BY,
} from '../../schema/nhentai.schema';
import { DoujinFromSource, NotionDoujin } from '../services/notion/doujin';
import { createRouter } from './context';

const fetcher = axios.create({
  baseURL: 'http://138.2.77.198:3002',
});
const doujinNotion = new NotionDoujin(env.NOTION_DOUJIN_DATABASE_ID);

export const nhentaiRouter = createRouter()
  .query('search', {
    input: z.object({
      query: z.string(),
      cursor: z.number().min(1).default(1),
      sort: nhentaiSortBySchema.default(NHENTAI_SORT_BY.POPULAR),
    }),
    async resolve({ input: { query, sort, cursor } }) {
      const { result: doujins, num_pages } = await searchDoujins({
        query,
        page: cursor,
        sort,
      });

      const result = doujins.map((doujin) => {
        const isTranslated = doujin.tags.language.some(
          (v) => v.name === 'translated'
        );

        return {
          id: doujin.id,
          title: doujin.title,
          cover: doujin.images.cover,
          language: select(
            doujin.tags.language,
            (tag) => tag.name,
            (tag) =>
              isTranslated
                ? tag.name !== 'translated' && tag.name !== 'japanese'
                : !!tag.name
          ),
        };
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (num_pages > cursor) {
        nextCursor = cursor + 1;
      }

      return {
        result,
        nextCursor,
      };
    },
  })
  .query('get', {
    input: z.object({
      id: doujinIdSchema,
    }),
    async resolve({ input: { id } }) {
      const doujin = await getDoujin(id);
      const notion = await doujinNotion.get(DoujinFromSource.NHENTAI, id);

      return {
        ...doujin,
        notion,
      };
    },
  })
  .mutation('save', {
    input: z.object({
      id: doujinIdSchema,
    }),
    async resolve({ input: { id } }) {
      const doujin = await getDoujin(id);

      const title =
        doujin.title.pretty ||
        doujin.title.english ||
        doujin.title.japanese ||
        'No Title';

      const notionDoujin = await doujinNotion.save({
        from: DoujinFromSource.NHENTAI,
        title,
        id: doujin.id,
        thumbnail: doujin.images.cover,
        authors: doujin.tags.artist.map(({ name }) => ({ name })),
        languages: doujin.tags.language.map(({ name }) => ({ name })),
        totalPages: doujin.num_pages,
        english: doujin.title.english || null,
        japanese: doujin.title.japanese || null,
        source: doujin.source,
      });

      return {
        notion: notionDoujin,
      };
    },
  });

const searchDoujins = async (params: {
  query: string;
  page: number;
  sort: NhentaiSortBy;
}) => {
  const { data } = await fetcher.get('/api/galleries/search', {
    params,
  });

  const result = Doujin.array().parse(data.result);
  const num_pages = z.number().parse(data.num_pages);
  return { result, num_pages };
};

const getDoujin = async (id: number) => {
  const { data } = await fetcher.get(`/api/gallery/${id}`);

  return Doujin.parse(data);
};
