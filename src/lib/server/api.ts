import 'server-only';
import argon2 from 'argon2';
import { ZodError, z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from './db';
import { ApiError, checkOrigin, clearCookie, createSession, publicProfile, rateIdentity, rateLimit, readBody, requireSession } from './security';
import { credentials, loginSchema, journalSchema, journalPatch, planSchema, profileSchema, querySchema } from '../schemas';
import * as service from './services';
const headers = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Cookie' };
const ok = (data: unknown, status = 200) => Response.json({ data }, { status, headers });
const empty = () => new Response(null, { status: 204, headers });
export async function handle(req: Request, path: string[]) {
  try {
    const route = path.join('/');
    const method = req.method;
    if (route === 'health' && method === 'GET') return ok({ status: 'ok', app: 'Pause' });
    if (['auth/register', 'auth/login'].includes(route) && method === 'POST') {
      checkOrigin(req);
      rateLimit('auth:' + rateIdentity(req), 15, 60000);
      if (route === 'auth/register') {
        const data = credentials.parse(await readBody(req));
        const passwordHash = await argon2.hash(data.password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
        const user = await db.user.create({ data: { email: data.email, passwordHash, nickname: data.nickname || null, timezone: data.timezone } });
        const csrfToken = await createSession(user.id);
        return ok({ user: publicProfile(user), csrfToken }, 201);
      }
      const data = loginSchema.parse(await readBody(req));
      rateLimit('email:' + data.email, 10, 60000);
      const user = await db.user.findUnique({ where: { email: data.email } });
      // Comparable work for an unknown email avoids a trivial timing oracle.
      const valid = user ? await argon2.verify(user.passwordHash, data.password) : (await argon2.hash(data.password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }), false);
      if (!user || !valid) throw new ApiError(401, 'CREDENTIALS', 'Email atau kata sandi belum sesuai.');
      return ok({ user: publicProfile(user), csrfToken: await createSession(user.id) });
    }
    const current = await requireSession(req);
    const userId = current.userId;
    if (route === 'auth/me' && method === 'GET') return ok({ user: publicProfile(current.user), csrfToken: current.csrfToken });
    if (route === 'auth/logout' && method === 'POST') {
      await db.session.deleteMany({ where: { id: current.id } });
      await clearCookie();
      return empty();
    }
    if (route === 'me' && method === 'PATCH') return ok(publicProfile(await db.user.update({ where: { id: userId }, data: profileSchema.parse(await readBody(req)) })));
    if (route === 'journal') {
      if (method === 'GET') return ok(await service.listEntries(userId, current.user.timezone, querySchema.parse(Object.fromEntries(new URL(req.url).searchParams))));
      if (method === 'POST') return ok(await service.saveEntry(userId, journalSchema.parse(await readBody(req))), 201);
    }
    if (path.length === 2 && path[0] === 'journal') {
      const id = z.uuid().parse(path[1]);
      if (method === 'GET') return ok(await service.getEntry(userId, id));
      if (method === 'PATCH') return ok(await service.saveEntry(userId, journalPatch.parse(await readBody(req)), id));
      if (method === 'DELETE') {
        await service.deleteEntry(userId, id);
        return empty();
      }
    }
    if (route === 'plan') {
      if (method === 'GET') return ok(await service.getPlan(userId));
      if (method === 'PUT') return ok(await service.putPlan(userId, planSchema.parse(await readBody(req))));
    }
    if (route === 'summary' && method === 'GET') return ok(await service.summary(userId, current.user.timezone, querySchema.parse(Object.fromEntries(new URL(req.url).searchParams))));
    if (route === 'export' && method === 'GET') {
      rateLimit('export:' + userId, 5, 60000);
      return new Response(JSON.stringify(await service.exportData(userId), null, 2), { headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="pause-ekspor.json"' } });
    }
    if (route === 'account' && method === 'DELETE') {
      rateLimit('delete:' + userId, 5, 60000);
      const data = z
        .object({ password: z.string().min(1).max(128), confirm: z.literal('HAPUS') })
        .strict()
        .parse(await readBody(req));
      if (!(await argon2.verify(current.user.passwordHash, data.password))) throw new ApiError(400, 'PASSWORD', 'Kata sandi belum sesuai.');
      await service.deleteAccount(userId);
      await clearCookie();
      return empty();
    }
    throw new ApiError(404, 'NOT_FOUND', 'Halaman API tidak ditemukan.');
  } catch (error) {
    if (error instanceof ZodError) return Response.json({ error: { code: 'VALIDATION', message: error.issues[0]?.message || 'Periksa isian.', fields: z.flattenError(error).fieldErrors } }, { status: 400, headers });
    if (error instanceof ApiError) return Response.json({ error: { code: error.code, message: error.message, fields: {} } }, { status: error.status, headers });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return Response.json({ error: { code: 'CONFLICT', message: 'Email ini sudah digunakan.', fields: {} } }, { status: 409, headers });
    // Never log sensitive request bodies or database errors.
    return Response.json({ error: { code: 'INTERNAL', message: 'Belum berhasil terhubung. Isianmu tetap di layar; coba lagi.', fields: {} } }, { status: 500, headers });
  }
}
