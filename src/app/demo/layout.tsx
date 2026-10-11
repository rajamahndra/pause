import { redirect } from "next/navigation";
import { session } from "@/lib/server/security";
import { WorkspaceProvider } from "@/features/workspace/context";
import { AppShell } from "@/features/workspace/shell";
export const metadata = { title: "Demo fiktif" };
export default async function Layout({ children }: { children: React.ReactNode }) {
  if (await session()) redirect("/app");
  return <WorkspaceProvider demo user={{id:"demo",email:"contoh@example.invalid",nickname:"Kawan",timezone:"Asia/Makassar",reducedMotion:false}}><AppShell>{children}</AppShell></WorkspaceProvider>;
}
