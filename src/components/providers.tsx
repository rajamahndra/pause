'use client';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 15000, retry: false }, mutations: { retry: false } } }));
  useEffect(() => {
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('pause-auth') : null;
    if (channel)
      channel.onmessage = () => {
        client.clear();
        location.reload();
      };
    const clear = () => {
      client.clear();
      channel?.postMessage('changed');
    };
    window.addEventListener('pause-clear-private', clear);
    return () => {
      window.removeEventListener('pause-clear-private', clear);
      channel?.close();
    };
  }, [client]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
