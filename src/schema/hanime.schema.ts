import { z } from 'zod';

const hanimeHentaiSchema = z.object({
  id: z.number(),
  name: z.string(),
  cover_url: z.string().url(),
});

export const hanimeSearchResponseSchema = z.object({
  nbPages: z.number(),
  hits: z.preprocess(
    (arg) => JSON.parse(arg as string),
    z.array(hanimeHentaiSchema)
  ),
});
