import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';

/**
 * URL da API - configurável via variável de ambiente
 */
const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

/**
 * Cliente tRPC não tipado (temporário)
 * TODO: Importar AppRouter do backend quando configurar shared types
 */
// @ts-ignore - Tipo temporário até configurar shared types
export const trpc = createTRPCReact<any>();

/**
 * Cliente tRPC configurado
 */
// @ts-ignore - Tipo temporário até configurar shared types
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,

      // Headers customizados (futuro: auth token)
      headers() {
        return {
          // Authorization: `Bearer ${token}`,
        };
      },
    }),
  ],
});
