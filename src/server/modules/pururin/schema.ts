import { z } from 'zod';

const getDoujinImageUrl = (id: PururinId, ext?: string) => {
  return `https://cdn.pururin.to/assets/images/data/${id}/cover.${
    ext || 'jpg'
  }`;
};

export const pururinIdSchema = z
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

export type PururinId = z.infer<typeof pururinIdSchema>;

const pururinTagSchema = z.object({
  id: pururinIdSchema,
  name: z.string(),
});

const pururinDoujinSchema = z.object({
  id: pururinIdSchema,
  title: z.string(),
  j_title: z
    .string()
    .transform((val) => (val.length > 0 ? val : null))
    .nullable(),
  alt_title: z
    .string()
    .transform((val) => (val.length > 0 ? val : null))
    .nullable(),
  slug: z.string(),
  total_pages: z.number(),
  image_extension: z.string(),
  tags: z.object({
    Artist: z.array(pururinTagSchema),
    Parody: z.array(pururinTagSchema),
    Character: z.array(pururinTagSchema),
    Language: z.array(pururinTagSchema),
    Category: z.array(pururinTagSchema),
    Contents: z.array(pururinTagSchema), // Real tags
  }),
});

// Search
const pururinSearchResultSchema = pururinDoujinSchema
  .pick({
    id: true,
    title: true,
    j_title: true,
    alt_title: true,
    slug: true,
    image_extension: true,
  })
  .transform((val) => ({
    ...val,
    image_url: getDoujinImageUrl(val.id, val.image_extension),
  }));

export const pururinSearchResponseSchema = z.object({
  status: z.boolean(),
  results: z.preprocess(
    (arg) => JSON.parse(arg as string),
    z.object({
      current_page: z.number(),
      data: z.array(pururinSearchResultSchema),
      next_page_url: z.string().nullable(),
    })
  ),
});

export enum PururinSearchSortBy {
  NEWEST = 'newest',
  MOST_POPULAR = 'most-popular',
  HIGHEST_RATED = 'highest-rated',
  MOST_VIEWED = 'most-viewed',
  TITLE = 'title',
}
export const PURURIN_SEARCH_SORT = Object.values(PururinSearchSortBy);
export const pururinSearchSortTypeSchema = z.nativeEnum(PururinSearchSortBy);

// Get
const pururinGetDoujinSchema = pururinDoujinSchema.transform((val) => ({
  ...val,
  image_url: getDoujinImageUrl(val.id, val.image_extension),
  source: `https://pururin.to/gallery/${val.id}/${val.slug}`,
}));

export const pururinGetResponseSchema = z.object({
  status: z.boolean(),
  gallery: pururinGetDoujinSchema,
});
