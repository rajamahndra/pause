import { OfflineLibrary } from '@/components/pwa';
export const metadata = { title: 'Bacaan offline' };
export default function Page() {
  return (
    <main id="main" className="narrow section">
      <span className="eyebrow">RUANG TANPA KONEKSI</span>
      <h1 style={{ margin: '24px 0' }}>
        Bacaan yang
        <br />
        <em>kamu simpan.</em>
      </h1>
      <p>Bantuan tanpa internet tersedia setelah persiapan berhasil. Jurnal, kontak, dan rencana pribadi memerlukan koneksi.</p>
      <OfflineLibrary />
    </main>
  );
}
