import { z } from 'zod';

export const hanimeIDSchema = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
    const parsed = parseInt(value.toString());
    if (isNaN(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Not a number',
      });

      return z.NEVER;
    }

    return parsed;
  });
export type HanimeID = z.infer<typeof hanimeIDSchema>;

const hanimeHentaiSchema = z.object({
  id: hanimeIDSchema,
  name: z.string(),
  slug: z.string(),
  cover_url: z.string().url(),
});

const hanimeTagSchema = z.object({
  id: hanimeIDSchema,
  text: z.string(),
});

const hanimeBrandSchmea = z.object({
  id: hanimeIDSchema,
  title: z.string(),
});

export const hanimeSearchResponseSchema = z.object({
  nbPages: z.number(),
  hits: z.preprocess(
    (arg) => JSON.parse(arg as string),
    z.array(hanimeHentaiSchema)
  ),
});

export const hanimeGetResponseSchema = z.object({
  hentai_video: hanimeHentaiSchema,
  hentai_tags: z.array(hanimeTagSchema),
  brand: hanimeBrandSchmea,
});
