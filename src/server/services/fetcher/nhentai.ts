import axios from 'axios';
import { z } from 'zod';
import { Doujin } from '../../schema/nhentai.schema';

const fetcher = axios.create({
  baseURL: 'http://138.2.77.198:3002',
});

export const getAllDoujins = async (params: {
  query: string;
  page: number;
  sort: string;
}) => {
  const { data } = await fetcher.get('/api/galleries/search', {
    params,
  });

  const result = Doujin.array().parse(data.result);
  const num_pages = z.number().parse(data.num_pages);
  return { result, num_pages };
};

export const getDoujin = async (id: number) => {
  const { data } = await fetcher.get(`/api/gallery/${id}`);

  return Doujin.parse(data);
};
