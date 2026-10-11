import { redirect } from 'next/navigation';
import { AuthForm } from '@/features/auth/form';
import { safeReturn } from '@/lib/return-url';
import { session } from '@/lib/server/security';
export const metadata = { title: 'Masuk' };
export default async function Page({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const returnTo = safeReturn((await searchParams).returnTo);
  if (await session()) redirect(returnTo);
  return <AuthForm registerMode={false} returnTo={returnTo} />;
}
