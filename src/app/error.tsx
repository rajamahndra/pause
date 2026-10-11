"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main id="main" className="narrow section"><h1>Belum berhasil memuat.</h1><p>Periksa koneksimu lalu coba lagi. Data yang sudah disimpan tetap ada di akunmu.</p><button className="button" onClick={reset}>Coba lagi</button></main>; }
