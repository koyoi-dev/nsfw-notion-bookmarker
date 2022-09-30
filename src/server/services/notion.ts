import { Client, isFullPage, Logger, LogLevel } from '@notionhq/client';
import { capitalize, select } from 'radash';
import { env } from '../../env/server.mjs';

const notionLogger: Logger = (level, message, extraInfo) => {
  console.log('notion:', level, message, JSON.stringify(extraInfo));
};

// Initializing a client
const notion = new Client({
  auth: env.NOTION_TOKEN,
  logLevel: env.NODE_ENV === 'development' ? LogLevel.INFO : LogLevel.ERROR,
  logger: notionLogger,
});

interface SaveDoujin {
  id: number;
  title: string;
  thumbnail: string;
  authors?: { name: string }[];
  languages?: { name: string }[];
  totalPages?: number | null;
  englishTitle?: string;
  japaneseTitle?: string;
}

export async function getDoujin(id: number, databaseId?: string) {
  const { results } = await notion.databases.query({
    database_id: databaseId ?? env.NOTION_NHENTAI_DATABASE_ID,
    filter: {
      property: 'ID',
      number: {
        equals: id,
      },
    },
  });

  if (results.length > 0 && results.every(isFullPage)) {
    return results[0] ?? null;
  }

  return null;
}

export async function saveDoujin(doujin: SaveDoujin, databaseId?: string) {
  const source = 'https://nhentai.net/g/' + doujin.id; // TODO: move this to constants

  const page = await notion.pages.create({
    parent: {
      database_id: databaseId ?? env.NOTION_NHENTAI_DATABASE_ID,
    },
    cover: {
      type: 'external',
      external: {
        url: doujin.thumbnail,
      },
    },
    properties: {
      Name: { title: [{ text: { content: doujin.title } }] },
      ID: { number: doujin.id },
      Authors: {
        multi_select:
          doujin.authors?.map(({ name }) => ({ name: capitalize(name) })) || [],
      },
      Languages: {
        multi_select: select(
          doujin.languages || [],
          (v) => ({ name: capitalize(v.name) }),
          (v) => v.name !== 'translated'
        ),
      },
      English: {
        rich_text: [{ text: { content: doujin.englishTitle || '' } }],
      },
      Japanese: {
        rich_text: [{ text: { content: doujin.japaneseTitle || '' } }],
      },
      'Total pages': { number: doujin.totalPages || null },
      Thumbnail: { url: doujin.thumbnail },
      Source: { url: source },
    },
  });

  if (!isFullPage(page)) {
    throw new Error('Page is not of type FullPage');
  }

  return page;
}

export async function getActress(slug: string, databaseId?: string) {
  const { results } = await notion.databases.query({
    database_id: databaseId ?? env.NOTION_JAVACTRESS_DATABASE_ID,
    filter: {
      property: 'Slug',
      rich_text: {
        equals: slug,
      },
    },
  });

  if (results.length > 0 && results.every(isFullPage)) {
    return results[0] ?? null;
  }

  return null;
}

interface SaveActress {
  slug: string;
  name: string;
  thumbnail: string | null;
  bio: string;
  japanese: string | null;
  height: number | null;
  waist: number | null;
  hip: number | null;
  bust: number | null;
  categories: { name: string }[];
  cup: { name: string } | null;
  twitter: string | null;
  instagram: string | null;
  birthdate: string | null;
}

export async function saveActress(actress: SaveActress, databaseId?: string) {
  const page = await notion.pages.create({
    parent: {
      database_id: databaseId ?? env.NOTION_JAVACTRESS_DATABASE_ID,
    },
    ...(actress.thumbnail && {
      cover: {
        type: 'external',
        external: {
          url: actress.thumbnail,
        },
      },
    }),
    properties: {
      Slug: { rich_text: [{ text: { content: actress.slug } }] },
      Name: { title: [{ text: { content: actress.name } }] },
      Japanese: { rich_text: [{ text: { content: actress.japanese || '' } }] },
      Height: { number: actress.height || null },
      Waist: { number: actress.waist || null },
      Hip: { number: actress.hip || null },
      Bust: { number: actress.bust || null },
      Cup: { select: actress.cup ? actress.cup : null },
      Categories: {
        multi_select: select(
          actress.categories,
          (v) => ({ name: capitalize(v.name) }),
          (v) => !!v.name
        ),
      },
      Birthdate: {
        date: actress.birthdate ? { start: actress.birthdate } : null,
      },
      Thumbnail: { url: actress.thumbnail },
      Twitter: { url: actress.twitter || null },
      Instagram: { url: actress.instagram || null },
    },
  });

  if (!isFullPage(page)) {
    throw new Error('Page is not of type FullPage');
  }

  return page;
}
