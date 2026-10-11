'use client';

import { usePathname } from 'next/navigation';
import { Header, Footer } from './header';
import { WorkspaceShell } from '@/features/workspace/shell';

export function PublicShell({ children, signedIn }: { children: React.ReactNode; signedIn: boolean }) {
  const pathname = usePathname();
  const education = pathname === '/edukasi' || pathname.startsWith('/edukasi/');

  if (signedIn && education) {
    return <WorkspaceShell contentHasMain>{children}</WorkspaceShell>;
  }

  return (
    <>
      <Header signedIn={signedIn} />
      {children}
      <Footer signedIn={signedIn} />
    </>
  );
}
