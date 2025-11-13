import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../backend/src/routes/index';

/**
 * URL da API - configurável via variável de ambiente
 */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Cliente tRPC tipado com o AppRouter do backend
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Cliente tRPC configurado
 */
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
