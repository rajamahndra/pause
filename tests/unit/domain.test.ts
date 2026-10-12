import { describe, it, expect } from 'vitest';
import { journalSchema, journalPatch, planSchema, querySchema } from '../../src/lib/schemas';
import { dayStart, localToInstant, instantToLocal } from '../../src/lib/dates';
import { safeReturn } from '../../src/lib/return-url';
describe('catatan minimal dan batas agregat', () => {
  it('menerima satu kalimat, menolak hanya tanggal atau ruang kosong', () => {
    expect(journalSchema.safeParse({ narrative: 'Aku ingin mengingat ini.' }).success).toBe(true);
    expect(journalSchema.safeParse({ title: '  ' }).success).toBe(false);
    expect(journalSchema.safeParse({ occurredAt: '2026-10-10T08:00:00Z', occurredTimezone: 'Asia/Makassar' }).success).toBe(false);
  });
  it('mewajibkan zona waktu ketika waktu pengalaman diisi', () => {
    expect(journalSchema.safeParse({ title: 'Contoh', occurredAt: '2026-10-10T08:00:00Z' }).success).toBe(false);
  });
  it('menolak userId serta actions terlalu banyak dan label kosong', () => {
    expect(journalSchema.safeParse({ title: 'a', userId: 'someone' }).success).toBe(false);
    expect(journalSchema.safeParse({ actions: [{ label: ' ', helpful: true }] }).success).toBe(false);
    expect(journalSchema.safeParse({ actions: Array.from({ length: 21 }, () => ({ label: 'Duduk', actionKey: 'sit' })) }).success).toBe(false);
  });
  it('PATCH membedakan field kosong dan field tidak dikirim', () => {
    expect(journalPatch.parse({ title: null })).toEqual({ title: null });
    expect(journalPatch.parse({})).toEqual({});
  });
  it('membatasi rencana dan memvalidasi kontak tanpa pihak ketiga', () => {
    expect(planSchema.safeParse({ steps: Array.from({ length: 11 }, () => ({ text: 'Duduk' })), contacts: [] }).success).toBe(false);
    expect(planSchema.safeParse({ steps: [], contacts: [{ name: 'Contoh', phone: 'javascript:alert(1)' }] }).success).toBe(false);
  });
  it('menolak rentang terbalik dan tanggal yang tidak ada', () => {
    expect(querySchema.safeParse({ from: '2026-02-30' }).success).toBe(false);
    expect(querySchema.safeParse({ from: '2026-10-10', to: '2026-10-01' }).success).toBe(false);
  });
});
describe('zona waktu', () => {
  it('mengubah input lokal dengan zona IANA, bukan offset tetap', () => {
    expect(localToInstant('2026-10-10T16:00', 'Asia/Makassar')).toBe('2026-10-10T08:00:00Z');
    expect(instantToLocal('2026-10-10T08:00:00Z', 'Asia/Jakarta')).toBe('2026-10-10T15:00');
  });
  it('mencakup hari DST 23 jam dan menolak waktu yang ambigu', () => {
    const a = dayStart('2026-03-08', 'America/New_York');
    const b = dayStart('2026-03-08', 'America/New_York', true);
    expect((+b - +a) / 3600000).toBe(23);
    expect(() => localToInstant('2026-03-08T02:30', 'America/New_York')).toThrow();
    expect(() => localToInstant('2026-11-01T01:30', 'America/New_York')).toThrow();
  });
});
describe('return URL', () => {
  it('menjaga route internal dan menolak redirect eksternal', () => {
    expect(safeReturn('/app/jurnal/baru')).toBe('/app/jurnal/baru');
    for (const url of ['//evil.test', 'https://evil.test', '/app/\\evil.test', '/app-other', '/app\n']) expect(safeReturn(url)).toBe('/app');
  });
});
