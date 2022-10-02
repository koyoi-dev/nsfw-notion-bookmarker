import dayjs from 'dayjs';
import { z } from 'zod';

export const javActressSchema = z.object({
  slug: z.string(),
  name: z.string(),
  japanese: z.string().nullable(),
  thumbnail: z.string().nullable(),
  source: z.string().nullable(),
});
export type JavActress = z.infer<typeof javActressSchema>;

export const javActressDetailSchema = javActressSchema.extend({
  birthdate: z
    .string()
    .transform((val) =>
      dayjs(val, 'MM/DD/YYYY', true).isValid()
        ? dayjs(val).format('YYYY-MM-DD')
        : null
    )
    .nullable(),
  height: z
    .preprocess((arg) => {
      if (typeof arg === 'string') {
        return parseInt(arg, 10);
      }
      return null;
    }, z.number())
    .nullable(),
  bust: z
    .preprocess((arg) => {
      if (typeof arg === 'string') {
        return parseInt(arg, 10);
      }
      return null;
    }, z.number())
    .nullable(),
  waist: z
    .preprocess((arg) => {
      if (typeof arg === 'string') {
        return parseInt(arg, 10);
      }
      return null;
    }, z.number())
    .nullable(),
  hip: z
    .preprocess((arg) => {
      if (typeof arg === 'string') {
        return parseInt(arg, 10);
      }
      return null;
    }, z.number())
    .nullable(),
  categories: z.array(z.string()),
  blood_type: z.string().nullable(),
});
export type JavActressDetail = z.infer<typeof javActressDetailSchema>;
