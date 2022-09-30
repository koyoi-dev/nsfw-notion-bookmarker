import { Client, Logger, LogLevel } from '@notionhq/client';
import { env } from '../../../env/server.mjs';

const notionLogger: Logger = (level, message, extraInfo) => {
  console.log('notion:', level, message, JSON.stringify(extraInfo));
};

// Initializing a client
export const notion = new Client({
  auth: env.NOTION_TOKEN,
  logLevel: env.NODE_ENV === 'development' ? LogLevel.INFO : LogLevel.ERROR,
  logger: notionLogger,
});
