import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';

const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

export const trpc = createTRPCReact<any>();

export const trpcClient = {
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
    }),
  ],
};
