'use client';
import { useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowUp, ArrowDown, X, Phone, Printer } from 'lucide-react';
import { useWorkspace, useUnsaved } from '@/features/workspace/context';
import { Dialog } from '@/components/dialog';
import { planSchema, type PlanInput } from '@/lib/schemas';
import type { Plan } from '@/lib/types';
export function cleanPlan(plan: Plan): PlanInput {
  return { title: plan.title, reminder: plan.reminder || null, preferredGuide: plan.preferredGuide, steps: plan.steps.map((s) => ({ text: s.text })), contacts: plan.contacts.map((c) => ({ name: c.name, phone: c.phone })) };
}
export const blankPlan = (): PlanInput => ({ title: 'Rencana dukungan saya', reminder: 'Aku bisa mengambil satu langkah pada satu waktu.', preferredGuide: null, steps: [], contacts: [] });
export function PlanPage() {
  const { read, user } = useWorkspace();
  const query = useQuery({ queryKey: ['plan', user.id], queryFn: () => read<Plan | null>('plan') });
  if (query.isPending) return <p role="status">Memuat rencana…</p>;
  if (query.error)
    return (
      <p className="error-message" role="alert">
        {query.error.message}
      </p>
    );
  return <PlanEditor initial={query.data || blankPlan()} />;
}
function PlanEditor({ initial }: { initial: Plan }) {
  const { demo, mutate } = useWorkspace();
  const client = useQueryClient();
  const [editing, setEditing] = useState(!initial.steps.length);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [call, setCall] = useState<{ name: string; phone: string } | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<PlanInput>({ defaultValues: cleanPlan(initial) });
  const steps = useFieldArray({ control, name: 'steps' });
  const contacts = useFieldArray({ control, name: 'contacts' });
  const values = useWatch({ control }) as PlanInput;
  useUnsaved(isDirty);
  const save = useMutation({
    mutationFn: (data: PlanInput) => mutate<Plan>('plan', 'PUT', data),
    onSuccess: async (data) => {
      reset(cleanPlan(data));
      setEditing(false);
      setSaved(true);
      await client.invalidateQueries({ queryKey: ['plan'] });
    },
  });
  async function submit(input: PlanInput) {
    setError('');
    const parsed = planSchema.safeParse({ ...input, preferredGuide: input.preferredGuide || null });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    try {
      await save.mutateAsync(parsed.data);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <div className="page-intro">
        <span className="eyebrow">RENCANA PRIBADI</span>
        <h1>
          Dukungan,
          <br />
          <em>dengan caramu.</em>
        </h1>
        <p>Siapkan langkah yang ingin kamu pilih. Rencana ini bisa berubah mengikuti kebutuhanmu.</p>
      </div>
      {saved && (
        <p className="success-message" role="status">
          Rencana sudah disimpan.
        </p>
      )}
      {!editing ? (
        <>
          <div className="panel plan-view">
            <h2>{values.title}</h2>
            {values.reminder && <div className="plan-reminder">“{values.reminder}”</div>}
            <ol>
              {values.steps.map((s, i) => (
                <li key={i}>
                  <span className="step-number">{i + 1}</span>
                  <span>{s.text}</span>
                </li>
              ))}
            </ol>
            {values.preferredGuide && <p className="hint">Panduan pilihan: {values.preferredGuide === 'breath' ? 'Napas lembut' : 'Fokus ke sekitar'}</p>}
            {values.contacts.length > 0 && (
              <>
                <h3>Orang tepercaya</h3>
                {values.contacts.map((c, i) => (
                  <button key={i} className="button button-outline" onClick={() => setCall(c)} style={{ margin: '8px 8px 0 0' }}>
                    <Phone size={16} />
                    {c.name}
                  </button>
                ))}
              </>
            )}
          </div>
          <div className="actions-row no-print" style={{ marginTop: 24 }}>
            <button
              className="button"
              onClick={() => {
                setEditing(true);
                setSaved(false);
              }}
            >
              Edit rencana
            </button>
            <button className="button button-outline" onClick={() => window.print()}>
              <Printer size={16} />
              Cetak rencana
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit(submit)}>
          <div className="field">
            <label htmlFor="plan-title">Judul rencana</label>
            <input id="plan-title" required maxLength={120} {...register('title')} />
          </div>
          <div className="field">
            <label htmlFor="reminder">
              Kalimat pengingat <span className="hint">(opsional)</span>
            </label>
            <textarea id="reminder" maxLength={1000} {...register('reminder')} />
          </div>
          <div className="form-section">
            <h2>Langkah dukungan</h2>
            <p className="hint">Maksimal 10 langkah. Atur sesuai urutan yang kamu pilih.</p>
            {steps.fields.map((s, i) => (
              <div className="plan-step" key={s.id}>
                <span className="step-number">{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label className="sr-only" htmlFor={'step-' + i}>
                    Langkah {i + 1}
                  </label>
                  <textarea id={'step-' + i} maxLength={300} required {...register(`steps.${i}.text`)} />
                </div>
                <div className="step-buttons">
                  <button type="button" className="icon-button" aria-label={'Naikkan langkah ' + (i + 1)} disabled={i === 0} onClick={() => steps.move(i, i - 1)}>
                    <ArrowUp size={15} />
                  </button>
                  <button type="button" className="icon-button" aria-label={'Turunkan langkah ' + (i + 1)} disabled={i === steps.fields.length - 1} onClick={() => steps.move(i, i + 1)}>
                    <ArrowDown size={15} />
                  </button>
                  <button type="button" className="icon-button" aria-label={'Hapus langkah ' + (i + 1)} onClick={() => steps.remove(i)}>
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
            {steps.fields.length < 10 && (
              <button type="button" className="button button-outline" onClick={() => steps.append({ text: '' })}>
                <Plus size={17} />
                Tambah langkah
              </button>
            )}
          </div>
          <div className="field">
            <label htmlFor="preferred">Panduan pilihan</label>
            <select id="preferred" {...register('preferredGuide')}>
              <option value="">Belum memilih</option>
              <option value="breath">Panduan napas</option>
              <option value="focus">Fokus ke sekitar</option>
            </select>
          </div>
          <div className="form-section">
            <h2>
              Orang tepercaya <span className="hint">(opsional)</span>
            </h2>
            <p className="hint">Maksimal 3 kontak. Tidak ada pesan atau panggilan otomatis.</p>
            {contacts.fields.map((c, i) => (
              <div className="contact-item" key={c.id}>
                <div className="field">
                  <label htmlFor={'name-' + i}>Nama kontak {i + 1}</label>
                  <input id={'name-' + i} required maxLength={80} {...register(`contacts.${i}.name`)} />
                </div>
                <div className="field">
                  <label htmlFor={'phone-' + i}>Nomor telepon</label>
                  <input type="tel" id={'phone-' + i} required maxLength={30} {...register(`contacts.${i}.phone`)} />
                </div>
                <button type="button" className="icon-button" aria-label={'Hapus kontak ' + (i + 1)} onClick={() => contacts.remove(i)}>
                  <X size={16} />
                </button>
              </div>
            ))}
            {contacts.fields.length < 3 && (
              <button type="button" className="button button-outline" onClick={() => contacts.append({ name: '', phone: '' })}>
                <Plus size={16} />
                Tambah kontak
              </button>
            )}
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="actions-row">
            <button className="button" disabled={save.isPending}>
              {save.isPending ? 'Menyimpan…' : 'Simpan rencana'}
            </button>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                if (!isDirty || confirm('Buang perubahan yang belum disimpan?')) {
                  reset(cleanPlan(initial));
                  setEditing(false);
                }
              }}
            >
              Batal
            </button>
          </div>
        </form>
      )}
      <Dialog open={!!call} title={demo ? 'Kontak fiktif' : 'Hubungi orang tepercaya?'} onClose={() => setCall(null)}>
        <p>{demo ? 'Kontak pada demo tidak dihubungi.' : `Buka panggilan ke ${call?.name} di ${call?.phone}? Panggilan hanya dimulai melalui aplikasi telepon atas pilihanmu.`}</p>
        <div className="actions-row">
          <button className="button button-outline" onClick={() => setCall(null)}>
            Kembali
          </button>
          {!demo && call && (
            <a className="button" href={'tel:' + call.phone.replace(/[^+\d]/g, '')} onClick={() => setCall(null)}>
              Buka telepon
            </a>
          )}
        </div>
      </Dialog>
    </>
  );
}
