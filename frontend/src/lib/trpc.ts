import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../backend/src/routes/index.js';

export const trpc = createTRPCReact<AppRouter>();
