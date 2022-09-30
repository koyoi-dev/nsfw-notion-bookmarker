import { z } from 'zod';
import dayjs from '../../utils/dayjs';

const TwitterSchema = z
  .string()
  .url()
  .transform((val) => {
    return {
      url: val,
      username: new URL(val).pathname.replaceAll('/', ''),
    };
  })
  .nullable();

const InstagramSchema = z
  .string()
  .url()
  .transform((val) => {
    return {
      url: val,
      username: new URL(val).pathname.replaceAll('/', ''),
    };
  })
  .nullable();

export const JavActressSchema = z.object({
  slug: z.string(),
  name: z.string(),
  japanese: z.string(),
  bio: z.string().nullable(),
  height: z.number().nullable(),
  waist: z.number().nullable(),
  hip: z.number().nullable(),
  bust: z.number().nullable(),
  categories: z.array(z.string()).nullable(),
  birthdate: z
    .string()
    .transform((val) => {
      if (dayjs(val, 'YYYY-MM-DD', true).isValid()) {
        return val;
      }
      return null;
    })
    .nullable(),
  blood_type: z.string().nullable(),
  thumbnail: z
    .string()
    .uuid()
    .transform((val) => `https://vje2ck1u.directus.app/assets/${val}`)
    .refine((val) => val.startsWith('https://vje2ck1u.directus.app/assets/'))
    .nullable(),
  twitter: TwitterSchema,
  instagram: InstagramSchema,
  cup: z.string().nullable(),
});
export type JavActress = z.infer<typeof JavActressSchema>;
