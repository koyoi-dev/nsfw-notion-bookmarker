import { omit, select } from 'radash';
import { z } from 'zod';

const NHENTAI_GALLERY_URL = 'http://i.nhentai.net/galleries';
const NHENTAI_URL = 'https://nhentai.net';

const doujinImageSchema = z.object({
  t: z
    .enum(['j', 'p', 'g'])
    .transform((value) =>
      value === 'j' ? 'jpg' : value === 'p' ? 'png' : 'gif'
    ),
});

const doujinTagsSchema = z
  .array(
    z.object({
      id: z.number(),
      type: z.enum([
        'artist',
        'character',
        'group',
        'language',
        'category',
        'parody',
        'tag',
      ]),
      name: z.string(),
      url: z.string().transform((value) => `${NHENTAI_URL}${value}`),
      count: z.number(),
    })
  )
  .transform((tags) => ({
    artist: select(
      tags,
      (tag) => omit(tag, ['type']),
      (tag) => tag.type === 'artist'
    ),
    character: select(
      tags,
      (tag) => omit(tag, ['type']),
      (tag) => tag.type === 'character'
    ),
    group: select(
      tags,
      (tag) => omit(tag, ['type']),
      (tag) => tag.type === 'group'
    ),
    language: select(
      tags,
      (tag) => omit(tag, ['type']),
      (tag) => tag.type === 'language'
    ),
    category: select(
      tags,
      (tag) => omit(tag, ['type']),
      (tag) => tag.type === 'category'
    ),
    parody: select(
      tags,
      (tag) => omit(tag, ['type']),
      (tag) => tag.type === 'parody'
    ),
    tag: select(
      tags,
      (tag) => omit(tag, ['type']),
      (tag) => tag.type === 'tag'
    ),
  }));

export const doujinIdSchema = z
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
    id: doujinIdSchema,
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
      pages: z.array(doujinImageSchema),
      cover: doujinImageSchema,
      thumbnail: doujinImageSchema,
    }),
    tags: doujinTagsSchema,
    upload_date: z
      .number()
      .transform((value) => new Date(value * 1000).toISOString()),
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
      source: `${NHENTAI_URL}/g/${doujin.id}`,
    };
  });
