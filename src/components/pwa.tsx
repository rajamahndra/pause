'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export async function workerMessage(data: object): Promise<{ ready?: boolean; items?: string[] }> {
  if (!('serviceWorker' in navigator)) throw new Error('Browser belum mendukung bantuan offline.');
  const registration = await navigator.serviceWorker.getRegistration();
  const worker = registration?.active;
  if (!worker) throw new Error('Bantuan offline belum siap. Buka Pause secara online lalu coba lagi.');
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => reject(new Error('Persiapan belum berhasil. Periksa koneksi dan coba lagi.')), 15000);
    channel.port1.onmessage = (e) => {
      clearTimeout(timer);
      channel.port1.close();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data);
    };
    worker.postMessage(data, [channel.port2]);
  });
}
export function Pwa() {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const opted = useRef(false);
  useEffect(() => {
    const detect = () => {
      setStandalone(matchMedia('(display-mode: standalone)').matches);
      setOffline(!navigator.onLine);
    };
    queueMicrotask(() => {
      detect();
      setIos(/iPad|iPhone|iPod/.test(navigator.userAgent));
      setBusy(document.documentElement.dataset.pauseBusy === 'true');
    });
    const prompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    const work = (e: Event) => setBusy(Boolean((e as CustomEvent).detail));
    const registered = () => {
      setInstall(null);
      setStandalone(true);
    };
    window.addEventListener('beforeinstallprompt', prompt);
    window.addEventListener('appinstalled', registered);
    window.addEventListener('pause-busy', work);
    window.addEventListener('online', detect);
    window.addEventListener('offline', detect);
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      const check = () =>
        workerMessage({ type: 'STATUS' })
          .then((r) => {
            setReady(!!r.ready);
            setFailed(!r.ready);
          })
          .catch(() => setFailed(true));
      navigator.serviceWorker
        .register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .then((reg) => {
          if (reg.waiting) setWaiting(reg.waiting);
          reg.addEventListener('updatefound', () => {
            const worker = reg.installing;
            worker?.addEventListener('statechange', () => {
              if (worker.state === 'installed') {
                if (navigator.serviceWorker.controller) setWaiting(worker);
                else navigator.serviceWorker.ready.then(check);
              }
            });
          });
          navigator.serviceWorker.ready.then(check);
          reg.update().catch(() => {});
        })
        .catch(() => setFailed(true));
    }
    const changed = () => {
      if (opted.current) location.reload();
    };
    navigator.serviceWorker?.addEventListener('controllerchange', changed);
    return () => {
      window.removeEventListener('beforeinstallprompt', prompt);
      window.removeEventListener('appinstalled', registered);
      window.removeEventListener('pause-busy', work);
      window.removeEventListener('online', detect);
      window.removeEventListener('offline', detect);
      navigator.serviceWorker?.removeEventListener('controllerchange', changed);
    };
  }, []);
  return (
    <>
      {offline && (
        <div className="network-banner no-print">
          Koneksi sedang terputus. Catatan dan rencana pribadi memerlukan koneksi.{' '}
          <a href="/offline-help/index.html" className="text-link">
            Buka bantuan tanpa internet
          </a>
        </div>
      )}
      <div className="pwa-bar no-print">
        {ready && <span>Bantuan tersedia offline</span>}
        {failed && (
          <>
            <span>Bantuan offline belum siap.</span>
            <button onClick={() => location.reload()}>Coba siapkan lagi</button>
          </>
        )}
        {!standalone && install && (
          <button
            onClick={async () => {
              await install.prompt();
              await install.userChoice;
              setInstall(null);
            }}
          >
            Pasang Pause
          </button>
        )}
        {!standalone && ios && <span>Pasang Pause: Bagikan → Tambahkan ke Layar Utama</span>}
        {ready && <Link href="/offline">Bacaan offline</Link>}
      </div>
      {waiting && (
        <div className="pwa-update" role="status">
          <span>Versi baru tersedia{busy ? '. Simpan atau hentikan panduan dahulu.' : '.'}</span>
          <button
            className="button button-outline"
            disabled={busy}
            onClick={() => {
              opted.current = true;
              waiting.postMessage({ type: 'ACTIVATE' });
            }}
          >
            Muat ulang
          </button>
        </div>
      )}
    </>
  );
}
export function OfflineArticle({ slug }: { slug: string }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    workerMessage({ type: 'LIST' })
      .then((r) => setSaved(!!r.items?.includes(slug)))
      .catch(() => {});
  }, [slug]);
  async function action() {
    setBusy(true);
    setMessage('');
    try {
      await workerMessage({ type: saved ? 'REMOVE_ARTICLE' : 'SAVE_ARTICLE', slug });
      setSaved(!saved);
      setMessage(saved ? 'Unduhan telah dihapus.' : 'Artikel sudah tersedia offline.');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="panel no-print" style={{ margin: '24px 0' }}>
      <h3>Bawa bacaan ini bersamamu.</h3>
      <p className="hint">Artikel publik pilihan dapat diunduh. Browser dapat menghapus penyimpanan ini.</p>
      <button className="button button-outline" disabled={busy} onClick={action}>
        {busy ? 'Menyiapkan…' : saved ? 'Hapus unduhan' : 'Simpan untuk offline'}
      </button>
      {message && (
        <p role="status" className="hint">
          {message}
        </p>
      )}
    </div>
  );
}
export function OfflineLibrary() {
  const [items, setItems] = useState<string[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    workerMessage({ type: 'LIST' })
      .then((r) => setItems(r.items || []))
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      {error && <p className="notice">{error}</p>}
      <div className="offline-list">
        {items.length ? (
          items.map((slug) => (
            <div className="offline-item" key={slug}>
              <a href={'/offline-education/' + slug + '.html'}>{slug.replaceAll('-', ' ')}</a>
              <button
                className="button button-outline"
                onClick={async () => {
                  try {
                    await workerMessage({ type: 'REMOVE_ARTICLE', slug });
                    setItems((v) => v.filter((s) => s !== slug));
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Hapus
              </button>
            </div>
          ))
        ) : (
          <p>Belum ada bacaan yang diunduh. Pilih “Simpan untuk offline” pada artikel saat tersambung.</p>
        )}
      </div>
      <a className="button" href="/offline-help/index.html">
        Buka bantuan tanpa internet
      </a>
      <p>Instalasi aplikasi tidak menjamin semua konten tersedia offline. Kunjungan pertama tanpa internet belum dapat menyiapkan konten.</p>
    </>
  );
}
