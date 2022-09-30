import axios from 'axios';
import { z } from 'zod';
import { JavActressSchema } from '../schema/jav-actress.schema';
import { saveActress } from '../services/notion';
import { createRouter } from './context';
import { getActress as getNotionActress } from '../services/notion';

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

      const notionActress = await getNotionActress(slug);

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

      const notionActress = await saveActress({
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

const GetAllActressSchema = z.object({
  data: z.array(
    JavActressSchema.pick({
      slug: true,
      name: true,
      japanese: true,
      thumbnail: true,
    })
  ),
  meta: z.object({
    filter_count: z.number(),
  }),
});
const getAllActress = async ({
  limit,
  page,
  query,
}: {
  limit: number;
  query: string;
  page: number;
}) => {
  const { data: directus } = await axios.get(
    'https://vje2ck1u.directus.app/items/actresses',
    {
      params: {
        limit,
        meta: 'filter_count',
        offset: limit * (page - 1),
        sort: ['name'],
        fields: ['slug', 'name', 'japanese', 'thumbnail'],
        ...(query && {
          filter: {
            _or: [
              { name: { _contains: query } },
              { japanese: { _contains: query } },
            ],
          },
        }),
      },
    }
  );

  return GetAllActressSchema.parse({ ...directus });
};

const getActress = async (slug: string) => {
  const { data: directus } = await axios.get(
    `https://vje2ck1u.directus.app/items/actresses/${slug}`
  );

  return JavActressSchema.parse(directus.data);
};
