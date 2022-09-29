import { group, isNumber } from 'radash';
import { z, ZodError } from 'zod';

const NHENTAI_GALLERY_URL = 'http://i.nhentai.net/galleries';
const NHENTAI_URL = 'https://nhentai.net';

const APIDoujinImage = z.object({
  t: z
    .enum(['j', 'p', 'g'])
    .transform((value) =>
      value === 'j' ? 'jpg' : value === 'p' ? 'png' : 'gif'
    ),
});

const APITagType = z.enum([
  'artist',
  'character',
  'group',
  'language',
  'category',
  'parody',
  'tag',
]);
type APITagType = z.infer<typeof APITagType>;

const APITag = z.object({
  id: z.number(),
  type: APITagType,
  name: z.string(),
  url: z.string().transform((value) => `${NHENTAI_URL}${value}`),
  count: z.number(),
});
type APITag = z.infer<typeof APITag>;

export const APIDoujinId = z
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

export const Doujin = z
  .object({
    id: APIDoujinId,
    /**
     * The media id of the doujin, used for fetching cover images
     * @example "987560"
     */
    media_id: z.string(),
    title: z.object({
      english: z.string().nullish(),
      japanese: z.string().nullish(),
      pretty: z.string().nullish(),
    }),
    images: z.object({
      pages: z.array(APIDoujinImage),
      cover: APIDoujinImage,
      thumbnail: APIDoujinImage,
    }),
    tags: z
      .array(APITag)
      .transform((tags) => group(tags, (tag) => tag.type))
      .refine((recordTag) => {
        try {
          z.record(APITag.shape.type, z.array(APITag)).parse(recordTag);

          return true;
        } catch (err) {
          return false;
        }
      }),
    upload_date: z
      .number()
      .transform((value) => new Date(value * 1000).toISOString()),
    /**
     * Number of pages in the doujin
     * @example 20
     */
    num_pages: z.number(),
    num_favorites: z.number(),
  })
  .transform((doujin) => {
    return {
      ...doujin,
      images: {
        ...doujin.images,
        pages: doujin.images.pages.map(
          (page, i) =>
            `${NHENTAI_GALLERY_URL}/${doujin.media_id}/${i}.${page.t}`
        ),
        cover: `${NHENTAI_GALLERY_URL}/${doujin.media_id}/1.${doujin.images.cover.t}`,
        thumbnail: `${NHENTAI_GALLERY_URL}/${doujin.media_id}/cover.${doujin.images.thumbnail.t}`,
      },
    };
  })
  .refine((doujin) => {
    try {
      z.string().url().parse(doujin.images.cover);
      z.string().url().parse(doujin.images.thumbnail);
      z.array(z.string().url()).parse(doujin.images.pages);

      return true;
    } catch (err) {
      return false;
    }
  });
