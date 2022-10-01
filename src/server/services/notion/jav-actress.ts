import { isFullPage } from '@notionhq/client';
import { capitalize, select } from 'radash';
import { notion } from './client';

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

export class NotionJavActress {
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
        Name: { title: [{ text: { content: actress.name } }] },
        Japanese: {
          rich_text: [{ text: { content: actress.japanese || '' } }],
        },
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
}
