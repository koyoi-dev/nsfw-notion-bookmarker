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
    return results[0]!;
  }

  return null;
}

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
