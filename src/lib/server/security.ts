import 'server-only';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const csrfFor = (token: string) => hash('pause-csrf:' + token);
export const publicProfile = (user: { id: string; email: string; nickname: string | null; timezone: string; reducedMotion: boolean }) => ({
  id: user.id,
  email: user.email,
  nickname: user.nickname,
  timezone: user.timezone,
  reducedMotion: user.reducedMotion,
});
export async function session() {
  const token = (await cookies()).get('pause_session')?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const record = await db.session.findUnique({ where: { tokenHash: hash(token) }, include: { user: true } });
  if (!record || record.expiresAt <= new Date()) return null;
  return { ...record, csrfToken: csrfFor(token) };
}
export function checkOrigin(req: Request) {
  const expected = process.env.APP_ORIGIN;
  if (!expected || req.headers.get('origin') !== expected) throw new ApiError(403, 'ORIGIN', 'Permintaan tidak berasal dari aplikasi ini.');
}
export async function requireSession(req?: Request) {
  const current = await session();
  if (!current) throw new ApiError(401, 'UNAUTHENTICATED', 'Sesi berakhir. Silakan masuk lagi.');
  if (req && !['GET', 'HEAD'].includes(req.method)) {
    checkOrigin(req);
    const token = req.headers.get('x-csrf-token') || '';
    const a = Buffer.from(hash(token)),
      b = Buffer.from(current.csrfTokenHash);
    if (!token || a.length !== b.length || !timingSafeEqual(a, b)) throw new ApiError(403, 'CSRF', 'Permintaan tidak valid. Muat ulang halaman lalu coba lagi.');
  }
  return current;
}
export async function createSession(userId: string) {
  const jar = await cookies();
  const old = jar.get('pause_session')?.value;
  const token = randomBytes(32).toString('hex');
  const csrfToken = csrfFor(token);
  await db.$transaction(async (tx) => {
    if (old) await tx.session.deleteMany({ where: { tokenHash: hash(old) } });
    await tx.session.create({ data: { userId, tokenHash: hash(token), csrfTokenHash: hash(csrfToken), expiresAt: new Date(Date.now() + 7 * 86400000) } });
  });
  const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(process.env.APP_ORIGIN || '');
  jar.set('pause_session', token, { httpOnly: true, secure: !(local && process.env.ALLOW_INSECURE_LOCAL_COOKIE === 'true'), sameSite: 'lax', path: '/', maxAge: 7 * 86400 });
  return csrfToken;
}
export async function clearCookie() {
  (await cookies()).set('pause_session', '', { httpOnly: true, path: '/', sameSite: 'lax', maxAge: 0 });
}
const buckets = new Map<string, { count: number; until: number }>();
export function rateLimit(key: string, max = 12, interval = 60000) {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.until < now) buckets.delete(k);
  const bucket = buckets.get(key) ?? { count: 0, until: now + interval };
  if (++bucket.count > max) throw new ApiError(429, 'RATE_LIMIT', 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.');
  buckets.set(key, bucket);
}
export const rateIdentity = (req: Request) => (process.env.TRUST_PROXY === 'true' ? (req.headers.get('x-forwarded-for')?.split(',')[0] || 'local').slice(0, 100) : 'single-instance');
export async function readBody(req: Request) {
  if (!req.headers.get('content-type')?.includes('application/json')) throw new ApiError(400, 'CONTENT_TYPE', 'Gunakan JSON.');
  if (Number(req.headers.get('content-length')) > 32768) throw new ApiError(413, 'BODY_SIZE', 'Isian terlalu panjang.');
  const reader = req.body?.getReader();
  if (!reader) throw new ApiError(400, 'BODY', 'Isian tidak ditemukan.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 32768) {
      await reader.cancel();
      throw new ApiError(413, 'BODY_SIZE', 'Isian terlalu panjang.');
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiError(400, 'JSON', 'Isian JSON tidak valid.');
  }
}
