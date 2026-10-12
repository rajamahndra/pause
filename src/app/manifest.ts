import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Pause',
    short_name: 'Pause',
    description: 'Sedikit ruang untuk dirimu.',
    lang: 'id',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F8F5EC',
    theme_color: '#F8F5EC',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
