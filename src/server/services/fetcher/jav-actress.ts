import axios from 'axios';
import { z } from 'zod';
import { JavActressSchema, BASE_URL } from '../../schema/jav-actress.schema';

const fetcher = axios.create({
  baseURL: BASE_URL,
});

const getAllActressSchema = z.object({
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

export const getAllActress = async ({
  limit,
  page,
  query,
}: {
  limit: number;
  query: string;
  page: number;
}) => {
  const { data: directus } = await fetcher.get('items/actresses', {
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
  });

  return getAllActressSchema.parse({ ...directus });
};

export const getActress = async (slug: string) => {
  const { data: directus } = await fetcher.get(`items/actresses/${slug}`);

  return JavActressSchema.parse(directus.data);
};
