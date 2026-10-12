'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Feather, Heart, BookOpen, Settings, ArrowUpRight } from 'lucide-react';
import { Logo } from '@/components/header';
import { PLAN_ENABLED } from '@/lib/features';
import { useWorkspace } from './context';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { demo, reset } = useWorkspace();
  return (
    <WorkspaceShell demo={demo} reset={reset}>
      {children}
    </WorkspaceShell>
  );
}

export function WorkspaceShell({ children, demo = false, reset, contentHasMain = false }: { children: React.ReactNode; demo?: boolean; reset?: () => void; contentHasMain?: boolean }) {
  const pathname = usePathname();
  const base = demo ? '/demo' : '/app';
  const nav = [
    { href: base, label: 'Beranda', icon: Home },
    { href: base + '/jurnal', label: 'Jurnal', icon: Feather },
    ...(PLAN_ENABLED ? [{ href: base + '/rencana', label: 'Rencana', icon: Heart }] : []),
    { href: '/edukasi', label: 'Edukasi', icon: BookOpen },
    { href: base + '/pengaturan', label: 'Pengaturan', icon: Settings },
  ];
  const Content = contentHasMain ? 'div' : 'main';

  function current(href: string) {
    return (href === base ? pathname === href : pathname.startsWith(href)) ? ('page' as const) : undefined;
  }

  return (
    <>
      {demo && (
        <div className="demo-banner">
          <span>Mode demo — data fiktif, tidak disimpan ke akun</span>
          <button onClick={reset}>Reset demo</button>
        </div>
      )}
      <header className="app-header">
        <div className="header-inner">
          <Logo href={base} />
          <Link href="/bantuan" className="button">
            Bantu saya sekarang <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <div className="app-layout">
        <nav className="side-nav" aria-label="Ruang pribadi">
          {nav.map((n) => (
            <Link href={n.href} key={n.href} aria-current={current(n.href)}>
              <n.icon size={18} />
              {n.label}
            </Link>
          ))}
        </nav>
        <Content id={contentHasMain ? undefined : 'main'} className="app-content">
          {children}
          <p className="app-bottom-note">Catat saat kamu sudah merasa siap. Pause adalah prototipe portofolio untuk edukasi dan dukungan mandiri; belum ditinjau tenaga profesional.</p>
        </Content>
      </div>
      <nav className="mobile-bottom" aria-label="Navigasi akun">
        {nav
          .filter((n) => n.label !== 'Pengaturan')
          .map((n) => (
            <Link key={n.href} href={n.href} aria-current={current(n.href)}>
              <n.icon />
              {n.label}
            </Link>
          ))}
        <Link href={base + '/pengaturan'} aria-label="Pengaturan" aria-current={current(base + '/pengaturan')}>
          <Settings />
          <span>Akun</span>
        </Link>
      </nav>
    </>
  );
}
