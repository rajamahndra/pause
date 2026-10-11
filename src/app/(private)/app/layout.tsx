import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { session, publicProfile } from '@/lib/server/security';
import { safeReturn } from '@/lib/return-url';
import { WorkspaceProvider } from '@/features/workspace/context';
import { AppShell } from '@/features/workspace/shell';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Ruang pribadi' };
export default async function Layout({ children }: { children: React.ReactNode }) {
  const current = await session();
  if (!current) redirect('/masuk?returnTo=' + encodeURIComponent(safeReturn((await headers()).get('x-pause-return'))));
  return (
    <WorkspaceProvider user={publicProfile(current.user)} csrf={current.csrfToken} expiresAt={current.expiresAt.toISOString()}>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
