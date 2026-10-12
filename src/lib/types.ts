import type { JournalInput, PlanInput } from './schemas';
export type Profile = { id: string; email: string; nickname: string | null; timezone: string; reducedMotion: boolean };
export type Entry = Omit<JournalInput, 'sensations'> & { id: string; createdAt: string; updatedAt: string; sensations: string[] };
export type Plan = PlanInput & { id?: string; updatedAt?: string };
export type Summary = { total: number; actions: { actionKey: string; label: string; count: number }[] };
