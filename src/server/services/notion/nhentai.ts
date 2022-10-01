import { INotionService } from './interface';
import { notion } from './client';
import { isFullPage } from '@notionhq/client';
import { capitalize, select } from 'radash';

interface SaveDoujin {
  id: number;
  title: string;
  thumbnail: string;
  authors: { name: string }[];
  languages: { name: string }[];
  totalPages: number | null;
  english: string | null;
  japanese: string | null;
  source: string | null;
}

export class NotionNhentai implements INotionService {
  constructor(private readonly databaseId: string) {}

  async get(id: number) {
    const { results } = await notion.databases.query({
      database_id: this.databaseId,
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
      },
    });

    if (!isFullPage(page)) {
      throw new Error('Page is not of type FullPage');
    }

    return page;
  }
}
