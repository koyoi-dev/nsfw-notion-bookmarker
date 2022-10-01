import axios from 'axios';
import {
  pururinGetResponseSchema,
  PururinId,
  pururinSearchResponseSchema,
  PururinSearchSortBy,
} from './schema';

const fetcher = axios.create({
  baseURL: 'https://pururin.to',
});

type SearchDoujin = {
  query: string;
  page?: number;
  sort?: PururinSearchSortBy;
};
export const searchDoujin = async ({ query, page, sort }: SearchDoujin) => {
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

export const getDoujin = async (id: PururinId) => {
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
