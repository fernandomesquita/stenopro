import { router } from '../lib/trpc.js';
import { transcriptionsRouter } from './transcriptions.js';
import { glossaryRouter } from './glossary.js';
import { promptsRouter } from './prompts.js';
import { auxiliaryDocsRouter } from './auxiliaryDocs.js';
import { promptTemplatesRouter } from './promptTemplates.js';

/**
 * App Router - Combina todos os sub-routers
 */
export const appRouter = router({
  transcriptions: transcriptionsRouter,
  glossary: glossaryRouter,
  prompts: promptsRouter,
  auxiliaryDocs: auxiliaryDocsRouter,
  promptTemplates: promptTemplatesRouter,
});

/**
 * Type export para o frontend
 */
export type AppRouter = typeof appRouter;
