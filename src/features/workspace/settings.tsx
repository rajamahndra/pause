'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Download, LogOut, Printer } from 'lucide-react';
import { useWorkspace, useUnsaved } from './context';
import { Dialog } from '@/components/dialog';
import { profileSchema } from '@/lib/schemas';
import type { Profile } from '@/lib/types';
export function SettingsPage() {
  const { user, demo, mutate, read } = useWorkspace();
  const router = useRouter();
  const client = useQueryClient();
  const [modal, setModal] = useState<'export' | 'delete' | null>(null);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [printData, setPrintData] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({ defaultValues: { nickname: user.nickname || '', timezone: user.timezone, reducedMotion: user.reducedMotion } });
  useUnsaved(isDirty);
  async function save(data: { nickname: string; timezone: string; reducedMotion: boolean }) {
    setError('');
    setBusy(true);
    try {
      const parsed = profileSchema.parse(data);
      const result = await mutate<Profile>('me', 'PATCH', parsed);
      reset({ nickname: result.nickname || '', timezone: result.timezone, reducedMotion: result.reducedMotion });
      await client.invalidateQueries();
      setSuccess('Preferensi sudah disimpan.');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setError('');
    setBusy(true);
    try {
      await mutate('auth/logout', 'POST');
      client.clear();
      window.dispatchEvent(new Event('pause-clear-private'));
      router.replace('/');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function exportOwn(print = false) {
    setBusy(true);
    setError('');
    try {
      let text: string;
      if (demo) text = JSON.stringify(await read('export'), null, 2);
      else {
        const res = await fetch('/api/v1/export', { cache: 'no-store', credentials: 'same-origin' });
        if (!res.ok) {
          if (res.status === 401) window.dispatchEvent(new Event('pause-session-expired'));
          throw new Error('Ekspor belum berhasil. Coba lagi saat tersambung.');
        }
        text = await res.text();
      }
      if (print) {
        setPrintData(text);
        setModal(null);
        setTimeout(() => window.print(), 100);
      } else {
        const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = demo ? 'pause-demo-fiktif.json' : 'pause-ekspor.json';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setModal(null);
        setSuccess('File ekspor sudah disiapkan.');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function deleteOwn() {
    setBusy(true);
    setError('');
    try {
      await mutate('account', 'DELETE', { password, confirm: confirmText });
      client.clear();
      window.dispatchEvent(new Event('pause-clear-private'));
      router.replace('/');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className={printData ? 'print-hide' : ''}>
        <div className="page-intro">
          <span className="eyebrow">PENGATURAN</span>
          <h1>
            Ruangmu,
            <br />
            <em>pilihanmu.</em>
          </h1>
          <p>{demo ? 'Akun contoh — data fiktif untuk demonstrasi.' : user.email}</p>
        </div>
        {error && !modal && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="success-message" role="status">
            {success}
          </p>
        )}
        <form onSubmit={handleSubmit(save)}>
          <div className="field">
            <label htmlFor="nickname">Nama panggilan</label>
            <input id="nickname" maxLength={60} {...register('nickname')} />
          </div>
          <div className="field">
            <label htmlFor="timezone">Zona waktu</label>
            <input id="timezone" maxLength={100} {...register('timezone')} />
            <small>Format IANA, misalnya Asia/Makassar. Digunakan pada filter dan tampilan tanggal.</small>
          </div>
          <label className="check-label">
            <input type="checkbox" {...register('reducedMotion')} />
            Kurangi animasi di ruang pribadi
          </label>
          <button className="button" style={{ marginTop: 20 }} disabled={busy}>
            Simpan preferensi
          </button>
        </form>
        <section className="settings-section">
          <h2>Salinan untukmu</h2>
          <p>Ekspor berisi catatan pribadi, rencana, dan kontak. Simpan file di tempat yang kamu pilih dengan hati-hati.</p>
          <div className="actions-row">
            <button
              className="button button-outline"
              onClick={() => {
                setModal('export');
                setError('');
              }}
            >
              <Download size={17} />
              Ekspor JSON
            </button>
            <button className="button button-outline" disabled={busy} onClick={() => exportOwn(true)}>
              <Printer size={17} />
              Tampilan cetak
            </button>
          </div>
        </section>
        <section className="settings-section">
          <h2>Tentang akunmu</h2>
          <p>Catatan dan rencana pribadi memerlukan koneksi. Draft tidak disimpan di perangkat. Reset kata sandi dan verifikasi email belum tersedia.</p>
          <button className="button button-outline" disabled={busy} onClick={logout}>
            <LogOut size={17} />
            {demo ? 'Keluar dari demo' : 'Keluar dari akun'}
          </button>
        </section>
        {!demo && (
          <section className="settings-section">
            <h2>Hapus akun</h2>
            <p>Menghapus akun, jurnal, rencana, kontak, dan sesi. Salinan ekspor yang pernah kamu unduh tetap berada di perangkatmu.</p>
            <button
              className="text-link"
              style={{ color: '#81372d' }}
              onClick={() => {
                setError('');
                setModal('delete');
              }}
            >
              Hapus akun dan data saya
            </button>
          </section>
        )}
      </div>
      {printData && (
        <div className="print-only">
          <h1>Pause — salinan pribadi</h1>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: '10pt' }}>{printData}</pre>
        </div>
      )}
      <Dialog open={modal === 'export'} title="Unduh catatan pribadimu?" onClose={() => !busy && setModal(null)}>
        <p>File JSON memuat jurnal, profil minimum, rencana, preferensi, dan kontak milikmu. File ini dapat dibaca siapa pun yang memiliki salinannya.</p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="actions-row">
          <button className="button button-outline" disabled={busy} onClick={() => setModal(null)}>
            Batal
          </button>
          <button className="button" disabled={busy} onClick={() => exportOwn()}>
            {busy ? 'Menyiapkan…' : 'Unduh JSON'}
          </button>
        </div>
      </Dialog>
      <Dialog open={modal === 'delete'} title="Hapus akun secara permanen?" onClose={() => !busy && setModal(null)}>
        <p>Data akun akan dihapus dalam satu transaksi. Salinan ekspor yang sudah kamu unduh tetap ada.</p>
        <div className="field">
          <label htmlFor="delete-password">Kata sandi saat ini</label>
          <input id="delete-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128} />
        </div>
        <div className="field">
          <label htmlFor="delete-confirm">Ketik HAPUS untuk mengonfirmasi</label>
          <input id="delete-confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="actions-row">
          <button className="button button-outline" disabled={busy} onClick={() => setModal(null)}>
            Pertahankan akun
          </button>
          <button className="button button-danger" disabled={busy || confirmText !== 'HAPUS' || !password} onClick={deleteOwn}>
            {busy ? 'Menghapus…' : 'Hapus akun saya'}
          </button>
        </div>
      </Dialog>
    </>
  );
}
