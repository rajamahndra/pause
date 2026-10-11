import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="main" className="narrow section">
      <span className="eyebrow">PAUSE / 404</span>
      <h1>Halaman belum ditemukan.</h1>
      <p>Kembali ke ruang yang kamu butuhkan.</p>
      <Link className="button" href="/">
        Ke beranda
      </Link>
    </main>
  );
}
