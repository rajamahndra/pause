import 'server-only';
import { Prisma } from '@prisma/client';
import { db } from './db';
import { ApiError, publicProfile } from './security';
import { journalSchema, type JournalInput, type PlanInput, type querySchema } from '../schemas';
import { dayStart, today } from '../dates';
import type { z } from 'zod';
const entryInclude = { actions: { orderBy: { position: 'asc' as const } } };
const planInclude = { steps: { orderBy: { position: 'asc' as const } }, contacts: { orderBy: { position: 'asc' as const } } };
export async function getEntry(userId: string, id: string) {
  const entry = await db.journalEntry.findFirst({ where: { id, userId }, include: entryInclude });
  if (!entry) throw new ApiError(404, 'NOT_FOUND', 'Catatan tidak ditemukan.');
  return entry;
}
export async function saveEntry(userId: string, input: Partial<JournalInput>, id?: string) {
  return db.$transaction(async (tx) => {
    const existing = id ? await tx.journalEntry.findFirst({ where: { id, userId }, include: entryInclude }) : null;
    if (id && !existing) throw new ApiError(404, 'NOT_FOUND', 'Catatan tidak ditemukan.');
    const merged = {
      ...(existing
        ? {
            title: existing.title,
            occurredAt: existing.occurredAt?.toISOString() ?? null,
            occurredTimezone: existing.occurredTimezone,
            sensations: existing.sensations as string[],
            situation: existing.situation,
            narrative: existing.narrative,
            takeaway: existing.takeaway,
            actions: existing.actions.map((a) => ({ actionKey: a.actionKey, label: a.label, helpful: a.helpful })),
          }
        : {}),
      ...input,
    };
    if (!merged.occurredAt) merged.occurredTimezone = null;
    const valid = journalSchema.parse(merged);
    const { actions, occurredAt, ...rest } = valid;
    const data = { ...rest, occurredAt: occurredAt ? new Date(occurredAt) : null };
    if (!id) return tx.journalEntry.create({ data: { ...data, userId, actions: { create: actions.map((a, position) => ({ ...a, position })) } }, include: entryInclude });
    return tx.journalEntry.update({ where: { id, userId }, data: { ...data, ...(input.actions !== undefined ? { actions: { deleteMany: {}, create: actions.map((a, position) => ({ ...a, position })) } } : {}) }, include: entryInclude });
  });
}
export async function deleteEntry(userId: string, id: string) {
  const result = await db.journalEntry.deleteMany({ where: { id, userId } });
  if (!result.count) throw new ApiError(404, 'NOT_FOUND', 'Catatan tidak ditemukan.');
}
function predicates(userId: string, zone: string, query: { from?: string; to?: string; q?: string }) {
  const parts = [Prisma.sql`"userId" = ${userId}::uuid`];
  if (query.from) parts.push(Prisma.sql`COALESCE("occurredAt", "createdAt") >= ${dayStart(query.from, zone)}`);
  if (query.to) parts.push(Prisma.sql`COALESCE("occurredAt", "createdAt") < ${dayStart(query.to, zone, true)}`);
  if (query.q) {
    const escaped = query.q.replace(/[\\%_]/g, '\\$&');
    const pattern = '%' + escaped + '%';
    parts.push(Prisma.sql`("title" ILIKE ${pattern} OR "situation" ILIKE ${pattern} OR "narrative" ILIKE ${pattern} OR "takeaway" ILIKE ${pattern})`);
  }
  return Prisma.join(parts, ' AND ');
}
export async function listEntries(userId: string, zone: string, query: z.infer<typeof querySchema>) {
  const where = predicates(userId, zone, query);
  const [ids, counts] = await db.$transaction([
    db.$queryRaw<{ id: string }[]>(Prisma.sql`SELECT id FROM "JournalEntry" WHERE ${where} ORDER BY COALESCE("occurredAt", "createdAt") DESC, "createdAt" DESC, id DESC LIMIT ${query.pageSize} OFFSET ${(query.page - 1) * query.pageSize}`),
    db.$queryRaw<{ total: bigint }[]>(Prisma.sql`SELECT count(*) AS total FROM "JournalEntry" WHERE ${where}`),
  ]);
  const entries = await db.journalEntry.findMany({ where: { userId, id: { in: ids.map((i) => i.id) } }, include: entryInclude });
  return { items: ids.map((i) => entries.find((e) => e.id === i.id)!), total: Number(counts[0].total), page: query.page, pageSize: query.pageSize };
}
export async function getPlan(userId: string) {
  return db.supportPlan.findUnique({ where: { userId }, include: planInclude });
}
export async function putPlan(userId: string, input: PlanInput) {
  const { steps, contacts, ...data } = input;
  return db.$transaction(async (tx) => {
    const plan = await tx.supportPlan.upsert({ where: { userId }, create: { ...data, userId }, update: data });
    await tx.supportPlanStep.deleteMany({ where: { planId: plan.id } });
    await tx.trustedContact.deleteMany({ where: { planId: plan.id } });
    if (steps.length) await tx.supportPlanStep.createMany({ data: steps.map((s, position) => ({ text: s.text, position, planId: plan.id })) });
    if (contacts.length) await tx.trustedContact.createMany({ data: contacts.map((c, position) => ({ ...c, position, planId: plan.id })) });
    return tx.supportPlan.findUniqueOrThrow({ where: { id: plan.id }, include: planInclude });
  });
}
export async function summary(userId: string, zone: string, query: { from?: string; to?: string }) {
  const where = predicates(userId, zone, { from: query.from ?? today(zone, 29), to: query.to ?? today(zone) });
  const ids = await db.$queryRaw<{ id: string }[]>(Prisma.sql`SELECT id FROM "JournalEntry" WHERE ${where}`);
  const actions = await db.journalAction.findMany({ where: { entryId: { in: ids.map((i) => i.id) }, helpful: true, actionKey: { not: null } }, select: { entryId: true, actionKey: true } });
  const names: Record<string, string> = { sit: 'Duduk sebentar', focus: 'Fokus ke lingkungan', breath: 'Napas lembut', contact: 'Menghubungi orang tepercaya' };
  const counts = new Map<string, Set<string>>();
  for (const a of actions) {
    const set = counts.get(a.actionKey!) ?? new Set<string>();
    set.add(a.entryId);
    counts.set(a.actionKey!, set);
  }
  return { total: ids.length, actions: [...counts].map(([actionKey, entries]) => ({ actionKey, label: names[actionKey], count: entries.size })).sort((a, b) => b.count - a.count) };
}
export async function exportData(userId: string) {
  const [user, journals, plan] = await db.$transaction([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    db.journalEntry.findMany({ where: { userId }, include: entryInclude, orderBy: { createdAt: 'desc' } }),
    db.supportPlan.findUnique({ where: { userId }, include: planInclude }),
  ]);
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), profile: publicProfile(user), preferences: { timezone: user.timezone, reducedMotion: user.reducedMotion }, journals, plan };
}
export async function deleteAccount(userId: string) {
  await db.$transaction(async (tx) => {
    await tx.user.delete({ where: { id: userId } });
  });
}
