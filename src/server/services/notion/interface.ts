import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export interface NotionService {
  get(id: unknown): Promise<PageObjectResponse | null>;
  save(data: unknown): Promise<PageObjectResponse>;
}
