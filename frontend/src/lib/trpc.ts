import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../backend/src/routes/index';

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
      url: import.meta.env.VITE_API_URL || 'http://localhost:3000/trpc',

      // Headers customizados (futuro: auth token)
      headers() {
        return {
          // Authorization: `Bearer ${token}`,
        };
      },
    }),
  ],
});
