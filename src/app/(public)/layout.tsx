import { PublicShell } from "@/components/public-shell";
import { session } from "@/lib/server/security";
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const signedIn = Boolean(await session());
  return <PublicShell signedIn={signedIn}>{children}</PublicShell>;
}
