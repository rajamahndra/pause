# Kemajuan Pause

- [x] Tahap 1: Next.js App Router, tema/font lokal, landing, enam artikel bersumber, bantuan, dan demo memory.
- [x] Tahap 2: PostgreSQL/Prisma/migrasi, Argon2id, sesi cookie, CSRF/Origin, akun dan CRUD jurnal.
- [x] Tahap 3: rencana, kontak berkonfirmasi, salin teks melalui pratinjau, ringkasan dedup, preferensi.
- [x] Tahap 4: ekspor/cetak/hapus akun, ikon/manifest/install UI, bantuan/edukasi offline, cache allowlist, update aman.
- [x] Build produksi, TypeScript, dan ESLint lulus tanpa error/warning.
- [x] 11 tes unit lulus: minimum catatan, PATCH, batas agregat, tanggal/DST, return URL, kontras aktual, dan sanitasi Markdown offline.
- [x] 15 tes Playwright lulus pada production build: tiga API integration dan dua belas tes browser.
- [x] API: ownership, CSRF/Origin, validasi, ekspor, rollback, cascade, logout, rotasi dan expiry.
- [x] Browser: daftar → jurnal → salin rencana → ekspor → logout; demo CRUD; rencana/kontak; gagal simpan; lebar 360 px; keyboard/reduced motion.
- [x] PWA: manifest/ikon/install UI; jaringan benar-benar diputus; reload bantuan; semua langkah/stop/mode teks; unduhan/hapus artikel; fallback privat; inspeksi cache; update menunggu panduan/form.
- [x] Screenshot desktop dan ponsel diperiksa, tanpa overflow horizontal pada halaman yang diuji. Font serif/italic dan sans lokal serta lisensi tersedia.
- [x] Migrasi dan seed berhasil pada database terpisah; seed tidak membuat akun atau jurnal.
- [x] Perbaikan registrasi lokal: APP_ORIGIN disamakan dengan server localhost:3000. Request dari browser tidak lagi ditolak 403. Empat tes terkait registrasi, Origin/CSRF, sesi, dan alur akun lulus pada database pengujian terpisah; tes regresi mencakup perbedaan port.
- [x] Beranda akun: sesi aktif mengalihkan landing/auth/demo ke /app, logo kembali ke ruang pribadi, navigasi publik menyesuaikan sesi, dan perubahan login/logout tersinkron antartab. Tes browser memeriksa tombol Back, URL langsung, returnTo, logout, dan sesi kedaluwarsa.
- [x] Kelima modal (hapus catatan, salin ke rencana, ekspor, hapus akun, dan kontak) berada di tengah viewport. Lima belas pemeriksaan browser pada 1897×917, 360×800, dan 800×360 lulus, termasuk batas layar, gulir konten panjang, Escape, dan pengembalian fokus. Build produksi lulus; screenshot modal desktop/ponsel tersedia di docs/screenshots.
- [x] Tombol Bantu saya sekarang hijau solid pada halaman publik, auth, akun, dan demo. Daftar edukasi serta artikel mempertahankan sidebar akun di desktop dan navigasi bawah di ponsel; menu Edukasi tetap aktif. Build, lint, dan 15 tes Playwright lulus, termasuk navigasi artikel, reload, dan kembali ke jurnal/beranda. Screenshot pendidikan akun desktop/ponsel tersedia di docs/screenshots.

Verifikasi: 10 Oktober 2026. Browser otomatis: Chromium 156 di Windows. Tes hanya menyentuh database pause_test terisolasi; database pengembangan pause_local terpisah. Server production untuk tes dihentikan oleh runner.

Batas: belum ada peninjauan klinis profesional, pengujian perangkat fisik iOS/Android, password reset/email verification, resolusi konflik suntingan antartab, rate limit multi-instance, atau backup hosting. Tidak ada publikasi/deployment. README menjelaskan batas prototipe serta perilaku online/offline.
