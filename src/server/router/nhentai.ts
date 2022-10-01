import { select } from 'radash';
import { z } from 'zod';
import { env } from '../../env/server.mjs';
import { doujinIdSchema } from '../schema/nhentai.schema';
import { getAllDoujins, getDoujin } from '../services/fetcher/nhentai';
import { NotionNhentai } from '../services/notion/nhentai';
import { createRouter } from './context';

const notionNhentai = new NotionNhentai(env.NOTION_NHENTAI_DATABASE_ID);

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
      const { result: doujins, num_pages } = await getAllDoujins({
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
      const notion = await notionNhentai.get(id);

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

      const authors = doujin.tags.artist.map((artist) => ({
        name: artist.name,
      }));
      const languages = doujin.tags.language.map((language) => ({
        name: language.name,
      }));

      const notionDoujin = await notionNhentai.save({
        title,
        id: doujin.id,
        thumbnail: doujin.images.cover,
        authors,
        languages,
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
