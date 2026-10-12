'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { request, RequestError } from '@/lib/client';
import { journalSchema, planSchema } from '@/lib/schemas';
import { dayStart, today } from '@/lib/dates';
import type { Entry, Plan, Profile, Summary } from '@/lib/types';
type Listing = { items: Entry[]; total: number; page: number; pageSize: number };
type DataClient = { demo: boolean; user: Profile; csrf: string; read: <T>(path: string) => Promise<T>; mutate: <T>(path: string, method: string, body?: unknown) => Promise<T>; reset: () => void };
const Context = createContext<DataClient | null>(null);
function sampleEntries(): Entry[] {
  const now = new Date().toISOString();
  return [
    {
      id: '11111111-1111-4111-8111-111111111111',
      title: 'Memberi ruang di sore hari',
      occurredAt: null,
      occurredTimezone: null,
      sensations: ['Berdebar'],
      situation: 'Setelah berada di tempat yang ramai.',
      narrative: 'Aku memilih duduk sebentar dan mengamati sekeliling. Ini cerita fiktif untuk demonstrasi.',
      takeaway: 'Aku boleh mengambil jeda sebelum melanjutkan.',
      actions: [
        { actionKey: 'sit', label: 'Duduk di tempat yang nyaman', helpful: true },
        { actionKey: 'focus', label: 'Memperhatikan benda di sekitar', helpful: true },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Satu hal pada satu waktu',
      occurredAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      occurredTimezone: 'Asia/Makassar',
      sensations: ['Gemetar'],
      narrative: 'Catatan ini menggunakan data fiktif. Aku ingin mengingat bahwa tidak semua hal harus dikerjakan sekaligus.',
      actions: [{ actionKey: 'breath', label: 'Napas lembut', helpful: null }],
      takeaway: 'Mulai dari langkah yang terasa mungkin.',
      createdAt: now,
      updatedAt: now,
    },
  ];
}
const samplePlan = (): Plan => ({
  title: 'Rencana dukungan saya',
  reminder: 'Aku bisa mengambil satu langkah pada satu waktu.',
  preferredGuide: 'focus',
  steps: [{ text: 'Duduk di tempat yang terasa nyaman.' }, { text: 'Perhatikan tumpuan kaki dan satu benda di sekitar.' }],
  contacts: [],
});
export function WorkspaceProvider({ children, demo = false, user, csrf = '', expiresAt }: { children: React.ReactNode; demo?: boolean; user: Profile; csrf?: string; expiresAt?: string }) {
  const [entries, setEntries] = useState(sampleEntries);
  const [plan, setPlan] = useState<Plan | null>(demo ? samplePlan : null);
  const [profile, setProfile] = useState(user);
  const client = useQueryClient();
  const router = useRouter();
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(profile.reducedMotion);
    return () => {
      delete document.documentElement.dataset.reducedMotion;
    };
  }, [profile.reducedMotion]);
  useEffect(() => {
    if (demo) return;
    const expired = () => {
      client.clear();
      router.replace('/masuk?returnTo=' + encodeURIComponent(location.pathname));
      router.refresh();
    };
    window.addEventListener('pause-session-expired', expired);
    return () => window.removeEventListener('pause-session-expired', expired);
  }, [demo, client, router]);
  useEffect(() => {
    if (demo) return;
    const check = () => {
      if (document.visibilityState === 'visible')
        request<{ user: Profile }>('auth/me')
          .then((result) => {
            if (result.user.id !== user.id) {
              client.clear();
              location.reload();
            }
          })
          .catch((error: unknown) => {
            if (error instanceof RequestError && error.status === 401) window.dispatchEvent(new Event('pause-session-expired'));
          });
    };
    const interval = setInterval(check, 60000);
    window.addEventListener('focus', check);
    const remaining = expiresAt ? new Date(expiresAt).getTime() - Date.now() : 7 * 86400000;
    const expiry = setTimeout(() => window.dispatchEvent(new Event('pause-session-expired')), Math.max(0, remaining));
    return () => {
      clearInterval(interval);
      clearTimeout(expiry);
      window.removeEventListener('focus', check);
    };
  }, [demo, user.id, client, expiresAt]);
  const read = useCallback(
    async <T,>(path: string): Promise<T> => {
      if (!demo) return request<T>(path);
      const [route, search = ''] = path.split('?');
      const params = new URLSearchParams(search);
      let data: unknown;
      if (route === 'export') data = { schemaVersion: 1, exportedAt: new Date().toISOString(), profile, preferences: { timezone: profile.timezone, reducedMotion: profile.reducedMotion }, journals: entries, plan };
      else if (route === 'plan') data = plan;
      else if (route === 'auth/me') data = { user: profile, csrfToken: 'demo' };
      else if (route.startsWith('journal/')) {
        data = entries.find((e) => e.id === route.split('/')[1]);
        if (!data) throw new Error('Catatan tidak ditemukan.');
      } else if (route === 'journal' || route === 'summary') {
        const q = (params.get('q') || '').toLowerCase();
        const from = params.get('from') || (route === 'summary' ? today(profile.timezone, 29) : '');
        const to = params.get('to') || (route === 'summary' ? today(profile.timezone) : '');
        const items = entries
          .filter((e) => {
            const at = new Date(e.occurredAt || e.createdAt);
            return (!from || at >= dayStart(from, profile.timezone)) && (!to || at < dayStart(to, profile.timezone, true)) && (!q || [e.title, e.situation, e.narrative, e.takeaway].some((v) => v?.toLowerCase().includes(q)));
          })
          .sort((a, b) => +new Date(b.occurredAt || b.createdAt) - +new Date(a.occurredAt || a.createdAt) || b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
        if (route === 'journal') {
          const page = Number(params.get('page') || 1);
          data = { items: items.slice((page - 1) * 20, page * 20), total: items.length, page, pageSize: 20 } satisfies Listing;
        } else {
          const counts = new Map<string, { label: string; ids: Set<string> }>();
          for (const e of items)
            for (const a of e.actions)
              if (a.helpful && a.actionKey) {
                const bucket = counts.get(a.actionKey) || { label: a.label, ids: new Set<string>() };
                bucket.ids.add(e.id);
                counts.set(a.actionKey, bucket);
              }
          data = { total: items.length, actions: [...counts].map(([actionKey, v]) => ({ actionKey, label: v.label, count: v.ids.size })) } satisfies Summary;
        }
      } else throw new Error('Data tidak ditemukan.');
      return data as T;
    },
    [demo, entries, plan, profile],
  );
  const mutate = useCallback(
    async <T,>(path: string, method: string, body?: unknown): Promise<T> => {
      if (!demo) {
        const result = await request<T>(path, { method, body, csrf });
        if (path === 'me') setProfile(result as Profile);
        return result;
      }
      let data: unknown;
      if (path === 'journal' && method === 'POST') {
        const input = journalSchema.parse(body);
        data = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        setEntries((v) => [data as Entry, ...v]);
      } else if (path.startsWith('journal/')) {
        const id = path.split('/')[1];
        const old = entries.find((e) => e.id === id);
        if (!old) throw new Error('Catatan tidak ditemukan.');
        if (method === 'DELETE') {
          setEntries((v) => v.filter((e) => e.id !== id));
        } else {
          data = { ...old, ...journalSchema.parse(body), updatedAt: new Date().toISOString() };
          setEntries((v) => v.map((e) => (e.id === id ? (data as Entry) : e)));
        }
      } else if (path === 'plan') {
        data = planSchema.parse(body);
        setPlan(data as Plan);
      } else if (path === 'me') {
        data = { ...profile, ...(body as object) };
        setProfile(data as Profile);
      } else if (path === 'auth/logout') {
        client.clear();
        router.push('/');
      } else throw new Error('Tindakan tidak tersedia di demo.');
      return data as T;
    },
    [demo, csrf, entries, profile, client, router],
  );
  return (
    <Context.Provider
      value={{
        demo,
        user: profile,
        csrf,
        read,
        mutate,
        reset: () => {
          setEntries(sampleEntries());
          setPlan(samplePlan());
          client.clear();
          router.push('/demo');
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error('Workspace unavailable');
  return value;
}
export function useUnsaved(dirty: boolean) {
  useEffect(() => {
    document.documentElement.dataset.pauseBusy = String(dirty);
    window.dispatchEvent(new CustomEvent('pause-busy', { detail: dirty }));
    if (!dirty) return;
    const before = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const click = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (anchor && anchor.href !== location.href && !anchor.hasAttribute('data-allow-unsaved') && !window.confirm('Ada perubahan belum tersimpan. Tetap meninggalkan halaman?')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', before);
    document.addEventListener('click', click, true);
    return () => {
      window.removeEventListener('beforeunload', before);
      document.removeEventListener('click', click, true);
      document.documentElement.dataset.pauseBusy = 'false';
      window.dispatchEvent(new CustomEvent('pause-busy', { detail: false }));
    };
  }, [dirty]);
}
