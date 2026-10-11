import { NextResponse, type NextRequest } from 'next/server';
export function proxy(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set('x-pause-return', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ['/app/:path*'] };
