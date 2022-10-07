import axios from 'axios';
import { load } from 'cheerio';
import { unique } from 'radash';
import { z } from 'zod';
import {
  JavActress,
  JavActressDetail,
  javActressDetailSchema,
  javActressSchema,
} from '../../schema/jav-actress.schema';
import { notionJavActress } from '../services/notion/jav-actress';
import { createRouter } from './context';

export const javActressRouter = createRouter()
  .query('search', {
    input: z.object({
      query: z.string(),
      cursor: z.number().min(1).default(1),
    }),
    async resolve({ input: { query, cursor } }) {
      const { result, hasNextPage } = await searchActress(query, cursor);
      let nextCursor: typeof cursor | undefined = undefined;
      if (hasNextPage) {
        nextCursor = cursor + 1;
      }

      return {
        result,
        nextCursor,
      };
    },
  })
  .query('get', {
    input: z.object({
      slug: z.string(),
    }),
    async resolve({ input: { slug } }) {
      const actress = await getActress(slug);

      const notionActress = await notionJavActress.get(slug);

      return {
        ...actress,
        notion: notionActress,
      };
    },
  })
  .mutation('save', {
    input: z.object({
      slug: z.string(),
    }),
    async resolve({ input: { slug } }) {
      const actress = await getActress(slug);

      const notionActress = await notionJavActress.save({
        slug: actress.slug,
        source: actress.source,
        name: actress.name,
        japanese: actress.japanese,
        thumbnail: actress.thumbnail,
        birthdate: actress.birthdate || '',
        height: actress.height,
        bust: actress.bust,
        waist: actress.waist,
        hip: actress.hip,
      });

      return {
        notion: notionActress,
      };
    },
  });

const searchActress = async (
  query: string,
  page: number
): Promise<{
  result: JavActress[];
  hasNextPage: boolean;
}> => {
  const { data: rawHtml } = await axios.get(
    `https://jav.link/model_listing.html?fullname_keyword=${query}&page=${page}`
  );

  const $ = load(rawHtml);

  const totalPages = parseInt(
    $('ul.pagination').find('li.page-item').last().prev().text(),
    10
  );

  // loop over all pages and map the results to an array of one level
  const scrapped = $('div.col-sm-12.col-md-6.col-lg-4')
    .find('a.pxp-agents-1-item')
    .map((_, el) => {
      const $el = $(el);
      const path = $el.attr('href');
      if (!path) {
        return;
      }

      const slug = path.replace('/jav/', '').replace(/\//g, '');
      const japanese = $el
        .find('div.pxp-agents-1-item-details')
        .find('div.pxp-agents-1-item-details-name:nth-child(1)')
        .text()
        .trim();
      const name = $el
        .find('div.pxp-agents-1-item-details')
        .find('div.pxp-agents-1-item-details-name:nth-child(2)')
        .text()
        .trim();
      const source = `https://jav.link${path}`;

      let thumbnail = $el.find('div.pxp-cover').css('background-image');
      if (thumbnail) {
        thumbnail = thumbnail
          .replace('url(', '')
          .replace(')', '')
          .replace(/"/g, '');
      }

      return {
        slug,
        name,
        japanese,
        thumbnail,
        source,
      };
    })
    .get();

  return z
    .object({
      result: z.array(javActressSchema),
      hasNextPage: z.boolean(),
    })
    .parse({
      result: unique(scrapped, (o) => o.slug),
      hasNextPage: page < totalPages,
    });
};

const getActress = async (slug: string): Promise<JavActressDetail> => {
  const source = `https://jav.link/jav/${slug}/`;
  const { data: html } = await axios.get(source);

  const $ = load(html);

  const [name, japanese] = z.tuple([z.string(), z.string()]).parse(
    $('h1.pxp-page-header')
      .text()
      .trim()
      .split('-')
      .map((s) => s.trim()),
    {
      path: ['header'],
    }
  );

  const rawThumbnail = $(
    'div.col-sm-12.offset-lg-1.col-lg-3.col-md-6 > div'
  ).css('background-image');
  const thumbnail = javActressSchema.shape.thumbnail.parse(
    rawThumbnail ? rawThumbnail.replace('url(', '').replace(')', '') : null,
    {
      path: ['thumbnail'],
    }
  );
  const height = javActressDetailSchema.shape.height.parse(
    $('div.pxp-sp-amenities-item:contains("Height")')
      .text()
      .trim()
      .match(/\d+/)?.[0],
    {
      path: ['height'],
    }
  );
  const bust = javActressDetailSchema.shape.bust.parse(
    $('div.pxp-sp-amenities-item:contains("Breast")')
      .text()
      .trim()
      .match(/\d+/)?.[0],
    {
      path: ['bust'],
    }
  );
  const waist = javActressDetailSchema.shape.waist.parse(
    $('div.pxp-sp-amenities-item:contains("Waist")')
      .text()
      .trim()
      .match(/\d+/)?.[0],
    {
      path: ['waist'],
    }
  );
  const hip = javActressDetailSchema.shape.hip.parse(
    $('div.pxp-sp-amenities-item:contains("Hip")')
      .text()
      .trim()
      .match(/\d+/)?.[0],
    {
      path: ['waist'],
    }
  );

  const birthdate = javActressDetailSchema.shape.birthdate.parse(
    $('div.pxp-single-property-section.mt-4.mt-md-5 > div')
      .find(`div.pxp-sp-amenities-item:contains("Born")`)
      .text()
      .trim()
      .match(/\d{2}\/\d{2}\/\d{4}/)?.[0],
    {
      path: ['birthdate'],
    }
  );

  const blood_type = javActressDetailSchema.shape.blood_type.parse(
    $('div.pxp-single-property-section.mt-4.mt-md-5 > div')
      .find(`div.pxp-sp-amenities-item:contains("Born")`)
      .text()
      .trim()
      .match(/A|B|AB|O/)?.[0],
    {
      path: ['blood_type'],
    }
  );

  const rawCategories = $(
    'div.pxp-sp-amenities-item:contains("Model\'s Style")'
  )
    .find('a')
    .map((_, el) => $(el).text().trim())
    .get();

  const categories = javActressDetailSchema.shape.categories.parse(
    rawCategories,
    {
      path: ['categories'],
    }
  );

  return {
    slug: slug,
    name: name,
    japanese: japanese,
    thumbnail: thumbnail,
    source: source,
    birthdate,
    blood_type,
    height,
    bust,
    waist,
    hip,
    categories,
  };
};
