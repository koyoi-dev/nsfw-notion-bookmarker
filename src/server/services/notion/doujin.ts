import { isFullPage } from '@notionhq/client';
import { capitalize, select } from 'radash';
import { notion } from './client';

// value will be the value of the property in Notion
export enum DoujinFromSource {
  NHENTAI = 'nhentai',
  PURURIN = 'pururin',
}

interface SaveDoujin {
  /**
   * From which domain the doujin is from (e.g. nhentai, pururin, etc.)
   */
  from: DoujinFromSource;
  id: number;
  title: string;
  source: string;
  thumbnail: string;
  authors: { name: string }[];
  languages: { name: string }[];
  totalPages: number | null;
  english: string | null;
  japanese: string | null;
}

export class NotionDoujin {
  constructor(private readonly databaseId: string) {}

  async get(from: DoujinFromSource, id: number) {
    const { results } = await notion.databases.query({
      database_id: this.databaseId,
      filter: {
        and: [
          {
            property: 'ID',
            number: {
              equals: id,
            },
          },
          {
            property: 'From',
            select: {
              equals: from,
            },
          },
        ],
      },
    });

    if (results.length > 0 && results.every(isFullPage)) {
      return results[0] ?? null;
    }

    return null;
  }

  async save(doujin: SaveDoujin) {
    const page = await notion.pages.create({
      parent: {
        database_id: this.databaseId,
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
            doujin.authors?.map(({ name }) => ({ name: capitalize(name) })) ||
            [],
        },
        Languages: {
          multi_select: select(
            doujin.languages || [],
            (v) => ({ name: capitalize(v.name) }),
            (v) => v.name !== 'translated'
          ),
        },
        English: {
          rich_text: [{ text: { content: doujin.english || '' } }],
        },
        Japanese: {
          rich_text: [{ text: { content: doujin.japanese || '' } }],
        },
        'Total pages': { number: doujin.totalPages || null },
        Thumbnail: { url: doujin.thumbnail },
        Source: { url: doujin.source },
        From: { select: { name: doujin.from } },
      },
    });

    if (!isFullPage(page)) {
      throw new Error('Page is not of type FullPage');
    }

    return page;
  }
}
