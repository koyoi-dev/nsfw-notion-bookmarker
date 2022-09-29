// src/server/router/index.ts
import { createRouter } from './context';
import superjson from 'superjson';

import { exampleRouter } from './example';
import { nhentaiRouter } from './nhentai';

export const appRouter = createRouter()
  .transformer(superjson)
  .merge('example.', exampleRouter)
  .merge('nhentai.', nhentaiRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
