import { isFullPage } from '@notionhq/client';
import { env } from '../../../env/server.mjs';
import { notion } from './client';

interface SaveActress {
  slug: string;
  name: string;
  japanese: string | null;
  thumbnail: string | null;
  source: string | null;

  birthdate: string | null;
  height: number | null;
  waist: number | null;
  hip: number | null;
  bust: number | null;
  cup?: { name: string } | null;

  twitter?: string;
  instagram?: string;
  bio?: string;
}

class NotionJavActress {
  constructor(private readonly databaseId: string) {}

  async get(slug: string) {
    const { results } = await notion.databases.query({
      database_id: this.databaseId,
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

  async save(actress: SaveActress) {
    const page = await notion.pages.create({
      parent: {
        database_id: this.databaseId,
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
        Source: { url: actress.source || null },
        Name: { title: [{ text: { content: actress.name } }] },
        Japanese: {
          rich_text: [{ text: { content: actress.japanese || '' } }],
        },
        Cup: {
          select: actress.cup ? { name: actress.cup.name } : null,
        },
        Height: { number: actress.height || null },
        Waist: { number: actress.waist || null },
        Hip: { number: actress.hip || null },
        Bust: { number: actress.bust || null },
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
}

export const notionJavActress = new NotionJavActress(
  env.NOTION_JAVACTRESS_DATABASE_ID
);
