import { initTRPC } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

/**
 * Contexto do tRPC (pode incluir user, session, etc no futuro)
 */
export function createContext({ req, res }: CreateExpressContextOptions) {
  return {
    req,
    res,
    // userId: req.session?.userId, // Futuro: autenticação
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * Inicialização do tRPC
 */
const t = initTRPC.context<Context>().create();

/**
 * Exports base do tRPC
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
