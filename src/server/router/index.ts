// src/server/router/index.ts
import { createRouter } from './context';
import superjson from 'superjson';

import { nhentaiRouter } from './nhentai';
import { javActressRouter } from './jav-actress';
import { pururinRouter } from './pururin';
import { hanimeRouter } from './hanime';

export const appRouter = createRouter()
  .transformer(superjson)
  .merge('hanime.', hanimeRouter)
  .merge('nhentai.', nhentaiRouter)
  .merge('jav-actress.', javActressRouter)
  .merge('pururin.', pururinRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
