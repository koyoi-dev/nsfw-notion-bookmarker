import axios from 'axios';
import { z } from 'zod';
import {
  hanimeGetResponseSchema,
  HanimeID,
  hanimeIDSchema,
  hanimeSearchResponseSchema,
} from '../../schema/hanime.schema';
import { notionHanime } from '../services/notion/hanime';
import { createRouter } from './context';

export const hanimeRouter = createRouter()
  .query('search', {
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
  })
  .query('get', {
    input: z.object({
      id: hanimeIDSchema,
    }),
    async resolve({ input: { id } }) {
      const hentai = await getHentai(id);

      const notion = await notionHanime.get(id);

      return {
        ...hentai,
        notion,
      };
    },
  })
  .mutation('save', {
    input: z.object({
      id: hanimeIDSchema,
    }),
    async resolve({ input: { id } }) {
      const hentai = await getHentai(id);

      const notion = await notionHanime.save({
        id,
        name: hentai.name,
        source: hentai.source,
        thumbnail: hentai.cover_url,
        brand: hentai.brand.title,
      });

      return {
        notion,
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

const GET_URL = 'https://hanime.tv/api/v8/video';
const VIDEO_URL = 'https://hanime.tv/videos/hentai';
const getHentai = async (id: HanimeID) => {
  const res = await axios.get(`${GET_URL}?id=${id}`);

  const {
    hentai_video: hentai,
    hentai_tags: tags,
    brand,
  } = hanimeGetResponseSchema.parse(res.data);

  return {
    tags,
    brand,
    source: `${VIDEO_URL}/${hentai.slug}`,
    ...hentai,
  };
};
