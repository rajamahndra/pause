'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="wordmark" aria-label="Pause, beranda">
      <span className="brand-symbol" aria-hidden="true">
        <i />
        <i />
      </span>
      Pause<span className="brand-dot">.</span>
    </Link>
  );
}
export function Header({ signedIn = false }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo href={signedIn ? '/app' : '/'} />
        <nav className={open ? 'main-nav is-open' : 'main-nav'} aria-label="Navigasi utama">
          <Link href="/edukasi" aria-current={pathname.startsWith('/edukasi') ? 'page' : undefined} onClick={() => setOpen(false)}>
            Ruang belajar
          </Link>
          {signedIn ? (
            <Link href="/app" onClick={() => setOpen(false)}>
              Ruang pribadi
            </Link>
          ) : (
            <>
              <Link href="/demo" onClick={() => setOpen(false)}>
                Coba demo <span className="tiny-tag">tanpa akun</span>
              </Link>
              <Link href="/masuk" onClick={() => setOpen(false)}>
                Masuk
              </Link>
            </>
          )}
        </nav>
        <Link href="/bantuan" className="button header-help">
          Bantu saya sekarang <ArrowUpRight size={16} />
        </Link>
        <button className="icon-button mobile-menu" aria-expanded={open} aria-label={open ? 'Tutup menu' : 'Buka menu'} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
export function Footer({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <footer className="site-footer">
      <div>
        <Logo href={signedIn ? '/app' : '/'} />
        <p>Sedikit ruang untuk dirimu.</p>
      </div>
      <div>
        <Link href="/edukasi">Ruang belajar</Link>
        <Link href="/offline">Bacaan & bantuan offline</Link>
        <Link href={signedIn ? '/app' : '/demo'}>{signedIn ? 'Ruang pribadi' : 'Jelajahi demo'}</Link>
      </div>
      <p className="footer-note">
        Prototipe portofolio untuk edukasi dan dukungan mandiri.
        <br />
        Belum ditinjau tenaga profesional. Bukan layanan diagnosis.
      </p>
      <span className="footer-bottom">
        Dibuat untuk langkah kecil, sesuai ritmemu. <span>Pause © 2026</span>
      </span>
    </footer>
  );
}
