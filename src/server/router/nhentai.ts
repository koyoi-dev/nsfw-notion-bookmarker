import { TRPCError } from '@trpc/server';
import axios from 'axios';
import { select, tryit } from 'radash';
import { z } from 'zod';
import { APIDoujinId, Doujin } from '../schema/doujin.schema';
import { getDoujin, saveDoujin } from '../services/notion';
import { createRouter } from './context';

// FIXME: move to a separate file
const NHENTAI_IP = 'http://138.2.77.198:3002';

export const nhentaiRouter = createRouter()
  .query('search', {
    input: z.object({
      query: z.string(),
      cursor: z.number().min(1).default(1),
      sort: z
        .enum(['popular', 'popular-week', 'popular-today'])
        .optional()
        .default('popular-today'),
    }),
    async resolve({ input: { query, sort, cursor } }) {
      const [err, res] = await tryit(axios.get<any>)(
        `${NHENTAI_IP}/api/galleries/search`,
        {
          params: {
            query,
            page: cursor,
            sort,
          },
        }
      );

      if (err) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch data from nhentai',
          cause: err,
        });
      }

      const { result: doujins, num_pages } = z
        .object({
          result: z.array(Doujin),
          num_pages: z.number(),
        })
        .parse(res.data);

      const result = doujins.map((doujin) => ({
        id: doujin.id,
        title: doujin.title,
        cover: doujin.images.cover,
        language: select(
          doujin.tags.language || [],
          (lang) => lang.name,
          (lang) => lang.name !== 'translated'
        )[0],
      }));

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
      id: APIDoujinId,
    }),
    async resolve({ input }) {
      const nhentaiId = input.id;

      const [err, res] = await tryit(axios.get<any>)(
        `${NHENTAI_IP}/api/gallery/${nhentaiId}`
      );

      if (err) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch doujin with id ' + nhentaiId,
          cause: err.message,
        });
      }

      const doujin = Doujin.parse(res.data);

      const notion = await getDoujin(nhentaiId);

      return {
        ...doujin,
        notion,
      };
    },
  })
  .mutation('save', {
    input: z.object({
      id: APIDoujinId,
    }),
    async resolve({ input }) {
      const nhentaiId = input.id;

      const [err, res] = await tryit(axios.get<any>)(
        `${NHENTAI_IP}/api/gallery/${nhentaiId}`
      );

      if (err) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch doujin with id ' + nhentaiId,
          cause: err.message,
        });
      }

      const doujin = Doujin.parse(res.data);

      const title =
        doujin.title.pretty ||
        doujin.title.english ||
        doujin.title.japanese ||
        'No Title';

      const authors = doujin.tags.artist?.map((artist) => ({
        name: artist.name,
      }));
      const languages = doujin.tags.language?.map((language) => ({
        name: language.name,
      }));

      const notionDoujin = await saveDoujin({
        title,
        id: nhentaiId,
        thumbnail: doujin.images.cover,
        authors,
        languages,
        totalPages: doujin.num_pages,
        englishTitle: doujin.title.english || '',
        japaneseTitle: doujin.title.japanese || '',
      });

      return {
        notion: notionDoujin,
      };
    },
  });
