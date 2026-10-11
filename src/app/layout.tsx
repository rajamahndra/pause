import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Providers } from '@/components/providers';
import { Pwa } from '@/components/pwa';
import '@/styles/globals.css';
const serif = localFont({
  src: [
    { path: '../../public/fonts/dm-serif-regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/dm-serif-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-serif',
  display: 'swap',
});
const sans = localFont({ src: '../../public/fonts/dm-sans.woff2', weight: '400', variable: '--font-sans', display: 'swap' });
export const metadata: Metadata = {
  title: { default: 'Pause — sedikit ruang untuk dirimu', template: '%s · Pause' },
  description: 'Ruang untuk memahami, mencatat pengalaman, dan menyiapkan dukungan pribadi. Sesuai ritmemu.',
  applicationName: 'Pause',
  appleWebApp: { capable: true, title: 'Pause', statusBarStyle: 'default' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#F8F5EC' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={serif.variable + ' ' + sans.variable}>
      <body>
        <a className="skip-link" href="#main">
          Langsung ke isi
        </a>
        <Providers>
          {children}
          <Pwa />
        </Providers>
      </body>
    </html>
  );
}
