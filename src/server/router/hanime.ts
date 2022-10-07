import axios from 'axios';
import { z } from 'zod';
import { hanimeSearchResponseSchema } from '../../schema/hanime.schema';
import { createRouter } from './context';

export const hanimeRouter = createRouter().query('search', {
  input: z.object({
    query: z.string(),
    cursor: z.number().min(1).default(1),
  }),
  async resolve({ input: { query, cursor } }) {
    const { nbPages, results } = await searchHentai({
      query,
      page: cursor,
    });

    let nextCursor: number | undefined = undefined;
    if (cursor < nbPages) {
      nextCursor = cursor + 1;
    }

    return {
      results,
      nextCursor,
    };
  },
});

type SearchHentai = {
  query: string;
  page?: number;
};
const SEARCH_URL = 'https://search.htv-services.com';
const searchHentai = async ({ query, page }: SearchHentai) => {
  const res = await axios.post(SEARCH_URL, {
    search_text: query,
    page: (page || 1) - 1,
    tags: [],
    tags_mode: 'AND',
    brands: [],
    blacklist: [],
    order_by: 'created_at_unix',
    ordering: 'desc',
  });

  const { nbPages, hits } = hanimeSearchResponseSchema.parse(res.data);

  return {
    nbPages,
    results: hits,
  };
};
