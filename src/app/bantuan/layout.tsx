import Link from 'next/link';
import { X } from 'lucide-react';
import { Logo } from '@/components/header';
export const metadata = { title: 'Bantu saya sekarang' };
export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="help-header">
        <Logo />
        <Link className="text-link" href="/">
          Keluar dari panduan <X size={17} />
        </Link>
      </header>
      <main id="main" className="help-main">
        {children}
      </main>
    </>
  );
}
