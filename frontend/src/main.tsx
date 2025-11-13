import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { Toaster } from 'react-hot-toast';
import { trpc } from './lib/trpc';
import App from './App.tsx';
import './styles/globals.css';

// URL da API
const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

// Configurar React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Criar cliente tRPC
// @ts-ignore - Tipo temporário até configurar shared types
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      headers() {
        return {};
      },
    }),
  ],
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* @ts-ignore - Tipo temporário do tRPC */}
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-right" />
        <App />
      </QueryClientProvider>
    {/* @ts-ignore - Tipo temporário do tRPC */}
    </trpc.Provider>
  </React.StrictMode>,
);
