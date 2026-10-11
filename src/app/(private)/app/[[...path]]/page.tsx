import { notFound, redirect } from 'next/navigation';
import { session } from '@/lib/server/security';
import { WorkspaceView } from '@/features/workspace/view';
import { validView } from '@/lib/routes';
export default async function Page({ params }: { params: Promise<{ path?: string[] }> }) {
  const path = (await params).path || [];
  if (!validView(path)) notFound();
  if (!(await session())) redirect('/masuk?returnTo=' + encodeURIComponent('/app/' + path.join('/')));
  return <WorkspaceView path={path} />;
}
