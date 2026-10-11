import { z } from "zod";
export const timezone = z.string().max(100).refine(v => { try { new Intl.DateTimeFormat("id", { timeZone: v }); return true; } catch { return false; } }, "Zona waktu tidak valid.");
const text = (max: number) => z.string().trim().max(max).nullable().optional();
export const actionKeys = ["sit", "focus", "breath", "contact"] as const;
export const actionSchema = z.object({ actionKey: z.enum(actionKeys).nullable().default(null), label: z.string().trim().min(1).max(200), helpful: z.boolean().nullable().default(null) });
export const journalFields = z.object({
  title: text(120), occurredAt: z.iso.datetime({ offset: true }).nullable().optional(), occurredTimezone: timezone.nullable().optional(),
  sensations: z.array(z.string().trim().min(1).max(100)).max(20).default([]), situation: text(2000), actions: z.array(actionSchema).max(20).default([]), narrative: text(5000), takeaway: text(1000)
}).strict();
export const substantive = (v: Partial<z.infer<typeof journalFields>>) => Boolean(v.title?.trim() || v.situation?.trim() || v.narrative?.trim() || v.takeaway?.trim() || v.sensations?.length || v.actions?.length);
export const journalSchema = journalFields.refine(substantive, { message: "Isi satu bagian saja juga cukup. Catatan kosong belum dapat disimpan.", path: ["narrative"] }).refine(v => !v.occurredAt || !!v.occurredTimezone, { message: "Zona waktu diperlukan jika waktu pengalaman diisi.", path: ["occurredTimezone"] });
export const journalPatch = journalFields.partial().extend({ sensations: journalFields.shape.sensations.removeDefault().optional(), actions: journalFields.shape.actions.removeDefault().optional() });
export const planSchema = z.object({ title: z.string().trim().min(1).max(120).default("Rencana dukungan saya"), reminder: text(1000), preferredGuide: z.enum(["breath", "focus"]).nullable().default(null), steps: z.array(z.object({ text: z.string().trim().min(1).max(300) })).max(10), contacts: z.array(z.object({ name: z.string().trim().min(1).max(80), phone: z.string().trim().min(3).max(30).regex(/^[+\d\s().-]+$/, "Gunakan format nomor telepon.") })).max(3) }).strict();
export const credentials = z.object({ email: z.string().trim().toLowerCase().max(254).pipe(z.email()), password: z.string().min(10, "Gunakan minimal 10 karakter.").max(128), nickname: z.string().trim().max(60).optional(), timezone: timezone.default("Asia/Makassar") }).strict();
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().max(254).pipe(z.email()), password: z.string().min(1).max(128) }).strict();
export const profileSchema = z.object({ nickname: text(60), timezone: timezone.optional(), reducedMotion: z.boolean().optional() }).strict();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().startsWith(v), "Tanggal tidak valid.");
export const querySchema = z.object({ from: date.optional(), to: date.optional(), q: z.string().trim().max(100).default(""), page: z.coerce.number().int().min(1).max(100000).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(20) }).refine(v => !v.from || !v.to || v.from <= v.to, { message: "Tanggal akhir harus setelah tanggal awal." });
export type JournalInput = z.infer<typeof journalSchema>;
export type PlanInput = z.infer<typeof planSchema>;
