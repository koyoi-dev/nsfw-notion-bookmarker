import { isFullPage } from '@notionhq/client';
import { env } from '../../../env/server.mjs';
import { HanimeID } from '../../../schema/hanime.schema';
import { notion } from './client';

interface SaveHanime {
  id: HanimeID;
  name: string;
  source: string;
  thumbnail: string;
  brand: string;
}

class NotionHanime {
  constructor(private readonly databaseId: string) {}

  async get(id: HanimeID) {
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

  async save(hanime: SaveHanime) {
    const page = await notion.pages.create({
      parent: {
        database_id: this.databaseId,
      },
      cover: {
        type: 'external',
        external: {
          url: hanime.thumbnail,
        },
      },
      properties: {
        ID: { number: hanime.id },
        Name: { title: [{ text: { content: hanime.name } }] },
        Source: { url: hanime.source },
        Brand: { select: { name: hanime.brand } },
        Thumbnail: { url: hanime.thumbnail },
      },
    });

    if (!isFullPage(page)) {
      throw new Error('Page is not of type FullPage');
    }

    return page;
  }
}

export const notionHanime = new NotionHanime(env.NOTION_HANIME_DATABASE_ID);
