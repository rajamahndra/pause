'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { journalSchema, type JournalInput } from '@/lib/schemas';
import { localToInstant, instantToLocal } from '@/lib/dates';
import { useWorkspace, useUnsaved } from '@/features/workspace/context';
import type { Entry } from '@/lib/types';
const catalogue = [
  { key: 'sit', label: 'Duduk sebentar' },
  { key: 'focus', label: 'Fokus ke lingkungan' },
  { key: 'breath', label: 'Napas lembut' },
  { key: 'contact', label: 'Menghubungi orang tepercaya' },
];
const sensations = ['Berdebar', 'Gemetar', 'Pusing', 'Napas terasa sulit', 'Rasa takut intens'];
type Fields = { title: string; localTime: string; situation: string; narrative: string; takeaway: string };
export function JournalEditorLoader({ id }: { id?: string }) {
  const { read, user } = useWorkspace();
  const query = useQuery({ queryKey: ['entry', user.id, id], queryFn: () => read<Entry>('journal/' + id), enabled: !!id });
  if (id && query.isPending) return <p role="status">Memuat catatan…</p>;
  if (query.error)
    return (
      <p role="alert" className="error-message">
        {query.error.message}
      </p>
    );
  return <JournalEditor key={id || 'new'} entry={query.data} />;
}
function JournalEditor({ entry }: { entry?: Entry }) {
  const { user, demo, mutate } = useWorkspace();
  const router = useRouter();
  const client = useQueryClient();
  const base = demo ? '/demo' : '/app';
  const [selected, setSelected] = useState(entry?.sensations || []);
  const [custom, setCustom] = useState('');
  const [actions, setActions] = useState<JournalInput['actions']>(entry?.actions.map((a) => ({ actionKey: a.actionKey, label: a.label, helpful: a.helpful })) || []);
  const [extraDirty, setExtraDirty] = useState(false);
  const [zone, setZone] = useState(entry?.occurredTimezone || user.timezone);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<Fields>({
    defaultValues: {
      title: entry?.title || '',
      localTime: entry?.occurredAt ? instantToLocal(entry.occurredAt, entry.occurredTimezone || user.timezone) : '',
      situation: entry?.situation || '',
      narrative: entry?.narrative || '',
      takeaway: entry?.takeaway || '',
    },
  });
  useUnsaved(isDirty || extraDirty);
  const mutation = useMutation({
    mutationFn: (data: JournalInput) => mutate<Entry>(entry ? 'journal/' + entry.id : 'journal', entry ? 'PATCH' : 'POST', data),
    onSuccess: async (result) => {
      reset();
      setExtraDirty(false);
      await client.invalidateQueries({ predicate: (q) => ['journal', 'entry', 'summary'].includes(String(q.queryKey[0])) });
      router.push(base + '/jurnal/' + result.id);
    },
  });
  async function submit(fields: Fields) {
    setError('');
    setFieldErrors({});
    let occurredAt: string | null = null;
    try {
      if (fields.localTime) occurredAt = localToInstant(fields.localTime, zone);
    } catch {
      setError('Waktu atau zona waktu belum sesuai. Pilih waktu yang tidak ambigu.');
      setFieldErrors({ localTime: 'Periksa waktu pengalaman dan zona waktu.' });
      return;
    }
    const clean = {
      title: fields.title || null,
      situation: fields.situation || null,
      narrative: fields.narrative || null,
      takeaway: fields.takeaway || null,
      occurredAt,
      occurredTimezone: occurredAt ? zone : null,
      sensations: selected,
      actions,
    };
    const valid = journalSchema.safeParse(clean);
    if (!valid.success) {
      setError(valid.error.issues[0].message);
      setFieldErrors(Object.fromEntries(valid.error.issues.map((i) => [i.path.join('.'), i.message])));
      return;
    }
    try {
      await mutation.mutateAsync(valid.data);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function changeActions(next: JournalInput['actions']) {
    setActions(next);
    setExtraDirty(true);
  }
  const errorProps = (name: string) => ({ 'aria-invalid': !!fieldErrors[name], 'aria-describedby': fieldErrors[name] ? name + '-error' : undefined });
  return (
    <>
      <Link href={base + '/jurnal'} className="text-link back-link">
        <ArrowLeft size={16} /> Ke jurnal
      </Link>
      <div className="page-intro">
        <span className="eyebrow">JURNAL PRIBADI</span>
        <h1>
          {entry ? (
            'Kembali ke catatanmu.'
          ) : (
            <>
              Satu kalimat
              <br />
              <em>juga cukup.</em>
            </>
          )}
        </h1>
        <p>Isi satu bagian saja juga cukup. Tidak perlu mengisi semuanya.</p>
      </div>
      <form onSubmit={handleSubmit(submit)}>
        <div className="field">
          <label htmlFor="title">
            Judul <span className="hint">(opsional)</span>
          </label>
          <input id="title" maxLength={120} placeholder="Beri nama untuk pengalaman ini…" {...register('title')} {...errorProps('title')} />
          {fieldErrors.title && <small id="title-error">{fieldErrors.title}</small>}
        </div>
        <div className="field">
          <label htmlFor="narrative">
            Apa yang ingin kamu ceritakan? <span className="hint">(opsional)</span>
          </label>
          <textarea id="narrative" rows={5} maxLength={5000} placeholder="Tulis dengan kata-katamu sendiri." {...register('narrative')} {...errorProps('narrative')} />
          {fieldErrors.narrative && <small id="narrative-error">{fieldErrors.narrative}</small>}
        </div>
        <details className="form-section" open={!!entry}>
          <summary>Detail tambahan, bila kamu ingin</summary>
          <div className="field">
            <label htmlFor="localTime">
              Waktu pengalaman <span className="hint">(opsional)</span>
            </label>
            <input id="localTime" type="datetime-local" {...register('localTime')} {...errorProps('localTime')} />
            <small>Biarkan kosong jika tidak ingat. Tanggal pembuatan disimpan terpisah.</small>
            {fieldErrors.localTime && <small id="localTime-error">{fieldErrors.localTime}</small>}
          </div>
          <div className="field">
            <label htmlFor="zone">Zona waktu pengalaman</label>
            <input
              id="zone"
              value={zone}
              onChange={(e) => {
                setZone(e.target.value);
                setExtraDirty(true);
              }}
              maxLength={100}
            />
            <small>Format IANA, misalnya Asia/Makassar atau Asia/Jakarta.</small>
          </div>
          <div className="field">
            <span className="field-label" id="sensations-label">
              Sensasi yang kamu rasakan <span className="hint">(opsional)</span>
            </span>
            <div className="chip-list" role="group" aria-labelledby="sensations-label">
              {[...new Set([...sensations, ...selected])].map((s) => (
                <button
                  type="button"
                  key={s}
                  className={'chip' + (selected.includes(s) ? ' active' : '')}
                  aria-pressed={selected.includes(s)}
                  onClick={() => {
                    setSelected((v) => (v.includes(s) ? v.filter((x) => x !== s) : [...v, s]));
                    setExtraDirty(true);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="actions-row">
              <label className="hint" htmlFor="custom-sensation">
                Sensasi lainnya
              </label>
              <input id="custom-sensation" value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={100} style={{ flex: 1, minWidth: 100 }} />
              <button
                type="button"
                className="icon-button"
                aria-label="Tambahkan sensasi"
                onClick={() => {
                  if (custom.trim() && selected.length < 20) {
                    setSelected((v) => [...new Set([...v, custom.trim()])]);
                    setCustom('');
                    setExtraDirty(true);
                  }
                }}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="situation">
              Situasi sebelumnya <span className="hint">(opsional)</span>
            </label>
            <textarea id="situation" maxLength={2000} {...register('situation')} />
            <small>Mencatat situasi tidak berarti menyimpulkan penyebab.</small>
          </div>
        </details>
        <div className="form-section">
          <h2>Apa yang kamu coba?</h2>
          <p className="hint">Opsional. Tandai berdasarkan pengalamanmu sendiri.</p>
          {actions.map((a, i) => (
            <div className="action-item" key={i}>
              <div>
                <div className="field">
                  <label htmlFor={'action-' + i}>Tindakan {i + 1}</label>
                  <input id={'action-' + i} maxLength={200} value={a.label} onChange={(e) => changeActions(actions.map((v, j) => (j === i ? { ...v, label: e.target.value } : v)))} />
                </div>
                <label htmlFor={'helpful-' + i} className="field-label">
                  Terasa membantu menurutmu?
                </label>
                <select
                  id={'helpful-' + i}
                  value={a.helpful === null ? 'unknown' : String(a.helpful)}
                  onChange={(e) => changeActions(actions.map((v, j) => (j === i ? { ...v, helpful: e.target.value === 'unknown' ? null : e.target.value === 'true' } : v)))}
                >
                  <option value="unknown">Belum tahu</option>
                  <option value="true">Ya, terasa membantu</option>
                  <option value="false">Tidak terasa membantu</option>
                </select>
              </div>
              <button type="button" className="icon-button" aria-label={'Hapus tindakan ' + (i + 1)} onClick={() => changeActions(actions.filter((_, j) => j !== i))}>
                <X size={17} />
              </button>
            </div>
          ))}
          {actions.length < 20 && (
            <div className="chip-list">
              {catalogue.map((a) => (
                <button type="button" className="chip" key={a.key} onClick={() => changeActions([...actions, { actionKey: a.key as JournalInput['actions'][0]['actionKey'], label: a.label, helpful: null }])}>
                  <Plus size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {a.label}
                </button>
              ))}
              <button type="button" className="chip" onClick={() => changeActions([...actions, { actionKey: null, label: '', helpful: null }])}>
                + Tindakan lainnya
              </button>
            </div>
          )}
        </div>
        <div className="field">
          <label htmlFor="takeaway">
            Hal yang ingin diingat <span className="hint">(opsional)</span>
          </label>
          <textarea id="takeaway" maxLength={1000} placeholder="Sesuatu untuk dirimu di lain waktu…" {...register('takeaway')} />
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="actions-row">
          <button disabled={mutation.isPending} className="button">
            {mutation.isPending ? 'Menyimpan…' : 'Simpan catatan'}
          </button>
          <Link href={base + '/jurnal'} className="text-link">
            Kembali
          </Link>
        </div>
        <p className="hint">Catatan disimpan setelah server mengonfirmasi. Draft hanya berada di layar ini.</p>
      </form>
    </>
  );
}
