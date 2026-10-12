'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { request } from '@/lib/client';
export function AuthForm({ registerMode, returnTo }: { registerMode: boolean; returnTo: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<{ email: string; password: string; nickname: string }>();
  async function submit(data: { email: string; password: string; nickname: string }) {
    setError('');
    try {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Makassar';
      await request('auth/' + (registerMode ? 'register' : 'login'), { method: 'POST', body: registerMode ? { ...data, timezone: zone } : { email: data.email, password: data.password } });
      window.dispatchEvent(new Event('pause-clear-private'));
      router.replace(returnTo);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <main id="main" className="auth-wrap">
      <span className="eyebrow">RUANG PRIBADIMU</span>
      <h1>
        {registerMode ? (
          <>
            Mulai dari
            <br />
            <em>satu langkah.</em>
          </>
        ) : (
          <>
            Senang kamu
            <br />
            <em>kembali.</em>
          </>
        )}
      </h1>
      <p>{registerMode ? 'Catat saat kamu sudah siap. Tidak ada tuntutan untuk menulis setiap hari.' : 'Ambil waktumu. Ruangmu ada di sini.'}</p>
      <form onSubmit={handleSubmit(submit)}>
        {registerMode && (
          <div className="field">
            <label htmlFor="nickname">
              Nama panggilan <span className="hint">(opsional)</span>
            </label>
            <input id="nickname" autoComplete="nickname" maxLength={60} {...register('nickname')} />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required maxLength={254} {...register('email')} />
        </div>
        <div className="field">
          <label htmlFor="password">Kata sandi</label>
          <input id="password" type="password" minLength={registerMode ? 10 : 1} maxLength={128} autoComplete={registerMode ? 'new-password' : 'current-password'} required aria-describedby="password-hint" {...register('password')} />
          <small id="password-hint">{registerMode ? 'Gunakan minimal 10 karakter.' : 'Gunakan kata sandi akunmu.'}</small>
        </div>
        {registerMode && <p className="hint">Catatan bersifat pribadi. Pause menyediakan edukasi dan dukungan mandiri bagi pengguna dewasa, tanpa diagnosis. Pemulihan kata sandi belum tersedia pada prototipe ini.</p>}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="button" disabled={isSubmitting}>
          {isSubmitting ? 'Sebentar…' : registerMode ? 'Buat ruang pribadi' : 'Masuk ke Pause'}
        </button>
      </form>
      <p className="auth-switch">
        {registerMode ? 'Sudah punya akun?' : 'Belum punya akun?'} <Link href={(registerMode ? '/masuk' : '/daftar') + '?returnTo=' + encodeURIComponent(returnTo)}>{registerMode ? 'Masuk' : 'Buat akun'}</Link>
      </p>
      <p className="auth-switch">
        <Link href="/demo">Kenali Pause lewat demo dahulu</Link>
      </p>
    </main>
  );
}
