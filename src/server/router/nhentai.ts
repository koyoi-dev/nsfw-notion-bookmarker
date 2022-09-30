import { select } from 'radash';
import { z } from 'zod';
import { doujinIdSchema } from '../schema/nhentai.schema';
import { getAllDoujins, getDoujin } from '../services/fetcher/nhentai';
import { getDoujin as getNotionDoujin, saveDoujin } from '../services/notion';
import { createRouter } from './context';

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
      const notion = await getNotionDoujin(id);

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

      const notionDoujin = await saveDoujin({
        title,
        id: doujin.id,
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
