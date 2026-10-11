import { handle } from "@/lib/server/api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handler(req: Request, context: { params: Promise<{ path: string[] }> }) { return handle(req, (await context.params).path); }
export { handler as GET, handler as POST, handler as PATCH, handler as PUT, handler as DELETE };
