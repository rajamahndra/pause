'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, ArrowLeft, Plus, Search, Printer, Trash2 } from 'lucide-react';
import { Flower } from '@/components/flower';
import { Dialog } from '@/components/dialog';
import { useWorkspace } from './context';
import { displayDate } from '@/lib/dates';
import { PLAN_ENABLED } from '@/lib/features';
import type { Entry, Plan, Summary } from '@/lib/types';
import { JournalEditorLoader } from '@/features/journal/editor';
import { PlanPage, cleanPlan, blankPlan } from '@/features/plan/editor';
import { SettingsPage } from './settings';
type Listing = { items: Entry[]; total: number; page: number; pageSize: number };
export function WorkspaceView({ path }: { path: string[] }) {
  if (!path.length) return <Dashboard />;
  if (path[0] === 'rencana') return <PlanPage />;
  if (path[0] === 'pengaturan') return <SettingsPage />;
  if (path.length === 1) return <JournalList />;
  if (path[1] === 'baru') return <JournalEditorLoader />;
  if (path[2] === 'edit') return <JournalEditorLoader id={path[1]} />;
  return <JournalDetail id={path[1]} />;
}
function EntryCard({ entry }: { entry: Entry }) {
  const { demo, user } = useWorkspace();
  return (
    <Link className="entry-card" href={(demo ? '/demo' : '/app') + '/jurnal/' + entry.id}>
      <div className="entry-card-content">
        <span className="entry-meta">{entry.occurredAt ? displayDate(entry.occurredAt, entry.occurredTimezone || user.timezone, true) : 'Waktu tidak dicatat'}</span>
        <h3>{entry.title || 'Catatan tanpa judul'}</h3>
        <div className="entry-card-tags">
          {entry.sensations.slice(0, 2).map((s) => (
            <span className="entry-tag" key={s}>
              {s}
            </span>
          ))}
          {!entry.sensations.length && <span className="hint">Sebuah ruang untuk refleksi</span>}
        </div>
      </div>
      <span className="entry-card-action">
        Buka catatan <ArrowUpRight size={16} aria-hidden="true" />
      </span>
    </Link>
  );
}
function Dashboard() {
  const { read, user, demo } = useWorkspace();
  const base = demo ? '/demo' : '/app';
  const recent = useQuery({ queryKey: ['journal', user.id, 'recent'], queryFn: () => read<Listing>('journal?pageSize=3') });
  const plan = useQuery({ queryKey: ['plan', user.id], queryFn: () => read<Plan | null>('plan'), enabled: PLAN_ENABLED });
  const stats = useQuery({ queryKey: ['summary', user.id], queryFn: () => read<Summary>('summary') });
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">RUANG PRIBADIMU</span>
        <h1>
          Halo{user.nickname ? ', ' + user.nickname : ''}.<br />
          <em>Apa kabarmu hari ini?</em>
        </h1>
        <p>Tidak ada yang harus diselesaikan sekarang. Mulai saat kamu siap.</p>
        {recent.data?.total === 0 && (
          <p className="notice">
            {PLAN_ENABLED
              ? 'Catatanmu bersifat pribadi. Kamu boleh mulai dari jurnal, menyiapkan rencana, atau menjelajahi edukasi. Membuat rencana bisa dilewati.'
              : 'Catatanmu bersifat pribadi. Kamu boleh mulai dari jurnal atau menjelajahi edukasi.'}
          </p>
        )}
        <Link href={base + '/jurnal/baru'} className="button">
          Catat pengalaman <Plus size={17} />
        </Link>
      </div>
      {PLAN_ENABLED && (
        <section className="panel panel-peach welcome-panel">
          <div>
            <span className="eyebrow">SATU LANGKAH PADA SATU WAKTU</span>
            <h2 style={{ marginTop: 16 }}>{plan.data?.steps.length ? 'Dukungan yang kamu pilih.' : 'Siapkan ruang untuk dirimu.'}</h2>
            <p>{plan.data?.reminder || 'Pilih langkah kecil dan pengingat yang ingin kamu simpan.'}</p>
            <Link href={base + '/rencana'} className="text-link">
              {plan.data?.steps.length ? 'Lihat rencanamu' : 'Buat rencana pribadi'} <ArrowRight size={17} />
            </Link>
          </div>
          <Flower />
        </section>
      )}
      <div className="section-heading">
        <h2>Catatan terakhir</h2>
        <Link href={base + '/jurnal'} className="text-link">
          Semua catatan <ArrowRight size={16} />
        </Link>
      </div>
      {recent.isPending ? (
        <p role="status">Memuat catatan…</p>
      ) : recent.error ? (
        <p className="error-message" role="alert">
          {recent.error.message}
        </p>
      ) : recent.data?.items.length ? (
        <div className="entry-list">
          {recent.data.items.slice(0, 3).map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Belum ada catatan.</h2>
          <p>Kamu bisa mulai kapan pun merasa siap. Isi satu bagian saja juga cukup.</p>
          <Link href={base + '/jurnal/baru'} className="text-link">
            Buat catatan pertama <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <div className="section-heading">
        <h2>Ruang refleksi</h2>
        <span className="hint">30 hari terakhir</span>
      </div>
      {stats.error ? (
        <p className="error-message" role="alert">
          {stats.error.message}
        </p>
      ) : (
        <div className="summary-box">
          <div>
            <span className="summary-number">{stats.isPending ? '…' : stats.data?.total || 0}</span>
            <p>catatan</p>
          </div>
          <div>
            <h3>Yang terasa membantu</h3>
            {stats.data?.actions.length ? (
              <ul>
                {stats.data.actions.map((a) => (
                  <li key={a.actionKey}>
                    {a.label} — ditandai membantu pada {a.count} catatan
                  </li>
                ))}
              </ul>
            ) : (
              <p>Belum ada tindakan yang ditandai membantu.</p>
            )}
            <p>Ringkasan ini hanya berdasarkan pengalaman yang kamu catat.</p>
          </div>
        </div>
      )}
      <Link href="/edukasi" className="text-link">
        Temukan bacaan di ruang belajar <ArrowUpRight size={17} />
      </Link>
    </>
  );
}
function JournalList() {
  const { read, user, demo } = useWorkspace();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);
  const params = new URLSearchParams({ q: search, page: String(page), ...(from ? { from } : {}), ...(to ? { to } : {}) });
  const query = useQuery({ queryKey: ['journal', user.id, search, from, to, page], queryFn: () => read<Listing>('journal?' + params) });
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">JURNAL PRIBADI</span>
        <h1>
          Jejak kecil,
          <br />
          <em>ceritamu sendiri.</em>
        </h1>
        <p>Kembali ke pengalaman yang kamu pilih untuk diingat.</p>
        <Link className="button" href={(demo ? '/demo' : '/app') + '/jurnal/baru'}>
          Catat pengalaman <Plus size={17} />
        </Link>
      </div>
      <div className="toolbar journal-filters no-print">
        <div className="field">
          <label htmlFor="journal-search">Cari catatan</label>
          <div className="search-box">
            <Search size={18} />
            <input id="journal-search" maxLength={100} placeholder="Cari kata dalam catatan…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="from">Dari tanggal</label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="to">Sampai tanggal</label>
          <input
            id="to"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>
      <p className="hint">Filter mengikuti waktu pengalaman, atau tanggal pembuatan jika waktu tidak dicatat. Zona waktu: {user.timezone}.</p>
      {query.isPending ? (
        <p role="status">Memuat catatan…</p>
      ) : query.error ? (
        <div className="error-message" role="alert">
          {query.error.message}
        </div>
      ) : !query.data?.items.length ? (
        <div className="empty-state">
          <h2>{search || from || to ? 'Tidak ada catatan yang sesuai.' : 'Belum ada catatan.'}</h2>
          <p>Kamu bisa mulai kapan pun merasa siap.</p>
        </div>
      ) : (
        <>
          <div className="entry-list">
            {query.data.items.map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </div>
          <div className="pagination no-print">
            <button className="icon-button" aria-label="Halaman sebelumnya" disabled={page === 1} onClick={() => setPage(page - 1)}>
              <ArrowLeft size={18} />
            </button>
            <span>
              {page} / {Math.ceil(query.data.total / query.data.pageSize)} · {query.data.total} catatan
            </span>
            <button className="icon-button" aria-label="Halaman berikutnya" disabled={page * query.data.pageSize >= query.data.total} onClick={() => setPage(page + 1)}>
              <ArrowRight size={18} />
            </button>
          </div>
        </>
      )}
    </>
  );
}
function JournalDetail({ id }: { id: string }) {
  const { read, mutate, user, demo } = useWorkspace();
  const base = demo ? '/demo' : '/app';
  const router = useRouter();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['entry', user.id, id], queryFn: () => read<Entry>('journal/' + id) });
  const [modal, setModal] = useState<'copy' | 'delete' | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const plan = useQuery({ queryKey: ['plan', user.id], queryFn: () => read<Plan | null>('plan'), enabled: PLAN_ENABLED && modal === 'copy' });
  if (query.isPending) return <p role="status">Memuat catatan…</p>;
  if (query.error || !query.data)
    return (
      <p className="error-message" role="alert">
        {query.error?.message || 'Catatan tidak ditemukan.'}
      </p>
    );
  const e = query.data;
  const options = [...e.actions.map((a) => a.label), ...(e.takeaway ? [e.takeaway] : [])];
  async function saveCopy() {
    setBusy(true);
    setError('');
    try {
      const latest = await read<Plan | null>('plan');
      if ((latest?.steps.length || 0) >= 10) throw new Error('Rencana sudah berisi 10 langkah. Edit rencana untuk menyediakan ruang.');
      const next = latest ? cleanPlan(latest) : blankPlan();
      await mutate('plan', 'PUT', { ...next, steps: [...next.steps, { text: text.trim() }] });
      await client.invalidateQueries({ queryKey: ['plan'] });
      setModal(null);
      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError('');
    try {
      await mutate('journal/' + id, 'DELETE');
      await client.invalidateQueries({ predicate: (q) => ['journal', 'summary', 'entry'].includes(String(q.queryKey[0])) });
      router.push(base + '/jurnal');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link href={base + '/jurnal'} className="text-link back-link">
        <ArrowLeft size={16} /> Kembali ke jurnal
      </Link>
      <article className="entry-detail">
        <span className="eyebrow">JURNAL PRIBADI</span>
        <h1>{e.title || 'Catatan tanpa judul'}</h1>
        <div className="detail-meta">
          {e.occurredAt ? (
            <>
              Waktu pengalaman: {displayDate(e.occurredAt, e.occurredTimezone || user.timezone, true)} ({e.occurredTimezone})
            </>
          ) : (
            'Waktu tidak dicatat'
          )}
          <br />
          Dibuat: {displayDate(e.createdAt, user.timezone, true)}
        </div>
        {success && (
          <p className="success-message" role="status">
            Langkah sudah ditambahkan ke rencana.
          </p>
        )}
        {e.narrative && (
          <>
            <h2>Ceritamu</h2>
            <p>{e.narrative}</p>
          </>
        )}
        {e.sensations.length > 0 && (
          <>
            <h2>Sensasi yang dirasakan</h2>
            <div className="chip-list">
              {e.sensations.map((s) => (
                <span className="chip" key={s}>
                  {s}
                </span>
              ))}
            </div>
          </>
        )}
        {e.situation && (
          <>
            <h2>Situasi sebelumnya</h2>
            <p>{e.situation}</p>
            <span className="hint">Catatan situasi tidak menyimpulkan penyebab.</span>
          </>
        )}
        {e.actions.length > 0 && (
          <>
            <h2>Yang kamu coba</h2>
            {e.actions.map((a, i) => (
              <div className="action-item" key={i}>
                <div>
                  {a.label}
                  <br />
                  <span className="hint">{a.helpful === true ? 'Terasa membantu' : a.helpful === false ? 'Tidak terasa membantu' : 'Belum tahu'}</span>
                </div>
              </div>
            ))}
          </>
        )}
        {e.takeaway && (
          <>
            <h2>Hal yang ingin diingat</h2>
            <div className="panel panel-sage">
              <p>{e.takeaway}</p>
            </div>
          </>
        )}
      </article>
      <div className="actions-row no-print" style={{ marginTop: 32 }}>
        {PLAN_ENABLED && options.length > 0 && (
          <button
            className="button"
            onClick={() => {
              setText(options[0]);
              setError('');
              setModal('copy');
            }}
          >
            Tambahkan ke rencana saya <Plus size={16} />
          </button>
        )}
        <Link className="button button-outline" href={base + '/jurnal/' + id + '/edit'}>
          Edit catatan
        </Link>
        <button className="icon-button" aria-label="Cetak catatan" onClick={() => window.print()}>
          <Printer size={18} />
        </button>
        <button
          className="icon-button"
          aria-label="Hapus catatan"
          onClick={() => {
            setModal('delete');
            setError('');
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
      <Dialog open={PLAN_ENABLED && modal === 'copy'} title="Satu langkah untuk rencanamu" onClose={() => !busy && setModal(null)}>
        <p>Pilih lalu sesuaikan teksnya. Salinan ini disimpan setelah kamu mengonfirmasi.</p>
        {plan.isPending ? (
          <p role="status">Memuat rencana…</p>
        ) : plan.error ? (
          <p role="alert">{plan.error.message}</p>
        ) : (
          <>
            <div className="field">
              <label htmlFor="copy-source">Ambil dari catatan</label>
              <select id="copy-source" onChange={(event) => setText(event.target.value)}>
                {options.map((v, i) => (
                  <option key={i} value={v}>
                    {v.length > 80 ? v.slice(0, 80) + '…' : v}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="copy-text">Pratinjau langkah</label>
              <textarea id="copy-text" value={text} onChange={(event) => setText(event.target.value)} />
              <small>{text.length} / 300 karakter. Sesuaikan teks panjang sebelum menyimpan.</small>
            </div>
            {(plan.data?.steps.length || 0) >= 10 && (
              <p className="notice">
                Batas 10 langkah sudah tercapai.{' '}
                <Link href={base + '/rencana'} className="text-link">
                  Edit rencana
                </Link>
              </p>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="actions-row">
          <button className="button button-outline" disabled={busy} onClick={() => setModal(null)}>
            Batal
          </button>
          <button className="button" disabled={busy || plan.isPending || !!plan.error || !text.trim() || text.length > 300 || (plan.data?.steps.length || 0) >= 10} onClick={saveCopy}>
            {busy ? 'Menyimpan…' : 'Konfirmasi & simpan'}
          </button>
        </div>
      </Dialog>
      <Dialog open={modal === 'delete'} title="Hapus catatan ini?" onClose={() => !busy && setModal(null)}>
        <p>Catatan yang dihapus tidak dapat dikembalikan.{PLAN_ENABLED && ' Langkah yang sudah kamu salin ke rencana tetap ada.'}</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="actions-row">
          <button className="button button-outline" onClick={() => setModal(null)} disabled={busy}>
            Batal
          </button>
          <button className="button button-danger" disabled={busy} onClick={remove}>
            {busy ? 'Menghapus…' : 'Ya, hapus catatan'}
          </button>
        </div>
      </Dialog>
    </>
  );
}
