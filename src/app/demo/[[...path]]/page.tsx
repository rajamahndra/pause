import { notFound, redirect } from "next/navigation";
import { session } from "@/lib/server/security";
import { WorkspaceView } from "@/features/workspace/view";
import { validView } from "@/lib/routes";
export default async function Page({ params }: { params: Promise<{ path?: string[] }> }) {
  if (await session()) redirect("/app");
  const path = (await params).path || [];
  if (!validView(path)) notFound();
  return <WorkspaceView path={path}/>;
}
