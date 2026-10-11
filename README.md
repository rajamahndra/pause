# Pause

Pause adalah aplikasi fullstack PWA berbahasa Indonesia untuk belajar, merefleksikan pengalaman panik, dan menyiapkan dukungan pribadi. Ini **prototipe portofolio untuk pengguna dewasa**, belum merupakan layanan kesehatan atau produk klinis tervalidasi. Materi seed belum ditinjau tenaga profesional.

## Menjalankan dari mesin baru

Prasyarat: Node.js 24 LTS (lihat .nvmrc), npm, dan Docker Compose atau PostgreSQL 16. Tidak ada layanan berbayar atau akun eksternal.

```sh
npm ci
cp .env.example .env
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build:offline
npm run dev
```

Pada PowerShell gunakan `Copy-Item .env.example .env`. Jika execution policy menolak npm.ps1, gunakan `npm.cmd`. Versi npm baru mungkin meminta izin install scripts; daftar yang disetujui untuk dependensi terpasang terdapat di package.json. Jalankan `npm rebuild` sesudah persetujuan bila diperlukan.

Buka http://localhost:3000. Halaman publik dan /demo bisa dijelajahi tanpa akun; akun asli memerlukan database. Seed memeriksa koneksi dan menggunakan enam artikel Markdown lokal; seed **tidak** membuat akun bersama atau jurnal pengguna.

Setelah login, beranda akun berada di /app. Membuka /, /masuk, /daftar, atau /demo dengan sesi aktif mengarahkan kembali ke ruang pribadi; halaman auth tetap menghormati returnTo internal /app. Daftar edukasi dan detail artikel mempertahankan sidebar akun pada desktop serta navigasi bawah pada ponsel, dengan menu Edukasi aktif. Tombol Bantu saya sekarang memakai warna hijau solid. Halaman utama dan demo kembali tersedia setelah logout atau sesi berakhir.

DATABASE_URL harus menunjuk database milik instalasi ini. APP_ORIGIN harus sama persis dengan origin browser, termasuk port. Jika port 3000 dipakai, ubah APP_ORIGIN menjadi http://localhost:3100 dan jalankan `npm run dev -- -p 3100`. Jangan memakai localhost dan 127.0.0.1 bergantian saat login. ALLOW_INSECURE_LOCAL_COOKIE=true hanya berlaku pada HTTP localhost/127.0.0.1. Pada deployment HTTPS, matikan pengecualian ini.

Tanpa Docker, buat database PostgreSQL lokal khusus Pause lalu sesuaikan DATABASE_URL. Database yang sudah ada tidak dimigrasi otomatis sampai kamu menjalankan db:migrate. Konfigurasi Compose hanya membuka port pada loopback.

## Yang dapat digunakan

- Landing peach/krem/sage, DM Serif Display normal/italic dan DM Sans lokal beserta lisensi OFL. UI responsif, navigasi akun ponsel, fokus keyboard, dialog native, dan reduced motion.
- Enam artikel Markdown publik: pencarian judul, kategori, sumber, tanggal pemeriksaan, status peninjauan yang jujur. HTML mentah tidak dirender; output offline juga disanitasi.
- Bantuan tanpa akun: napas opsional 4 detik masuk/4 detik keluar tanpa tahan napas, mode teks, stop, dan panduan perhatian satu langkah per layar. Informasi medis dapat dibuka kapan saja.
- Registrasi, login, logout; sesi cookie opaque HttpOnly selama tujuh hari, hash token di DB, Argon2id, CSRF, Origin, validasi, pembatasan body, dan rate limit.
- CRUD jurnal dengan semua isian individual opsional, minimal satu isian substantif, actions terstruktur, waktu pengalaman terpisah dari createdAt, zona IANA, pencarian 300 ms, filter tanggal lokal, dan paginasi 20 entri.
- Satu rencana per akun, maksimum 10 langkah dengan naik/turun, pengingat, pilihan panduan, maksimum tiga kontak. Panggilan memakai tel: hanya setelah konfirmasi; tidak ada pengiriman pesan otomatis.
- Salin tindakan/hal yang diingat dari detail jurnal melalui pilihan, edit pratinjau, dan konfirmasi. Teks menjadi salinan mandiri; jurnal asal dapat dihapus.
- Ringkasan faktual 30 hari, dedup actionKey per catatan, tanpa skor kesehatan atau analisis penyebab.
- Ekspor JSON milik sendiri, cetak detail jurnal/rencana, preferensi, dan hapus akun menggunakan kata sandi serta konfirmasi HAPUS. Penghapusan berelasi memakai transaksi dan cascade.
- /demo memakai data fiktif di memori tab, mendukung perubahan dan reset. Reload mengembalikan dataset awal; tidak ada akun demo bersama atau panggilan API pribadi.

## Production build dan PWA

```sh
npm run build
npm run start
```

Build membuat font, ikon PNG 192/512, maskable, apple-touch-icon, bantuan mandiri, artikel offline publik, dan service worker dengan versi hash konten. SW hanya diregistrasikan pada production; dev tidak menyediakan klaim offline-ready.

Di Chrome/Android, “Pasang Pause” muncul ketika browser memberikan beforeinstallprompt. Di Safari/iOS, gunakan **Bagikan → Tambahkan ke Layar Utama**. Ajakan disembunyikan dalam standalone. Prompt instalasi tidak diminta paksa, dan tidak ada izin notifikasi.

| Fitur | Offline |
| --- | --- |
| Bantuan tanpa internet, napas, fokus | Setelah “Bantuan tersedia offline” muncul |
| Edukasi | Hanya artikel yang dipilih lewat “Simpan untuk offline” |
| Daftar/hapus bacaan unduhan | /offline saat online; fallback mandiri saat offline |
| Akun, jurnal, rencana, kontak, ekspor, hapus akun | Memerlukan koneksi |

Instalasi bukan jaminan seluruh konten tersedia offline. Kunjungan pertama tanpa jaringan tidak dapat mengunduh aset. Browser dapat menghapus cache. Gagal menyimpan mempertahankan isian di memori, memberi pesan gagal, dan tidak mengantre mutasi atau mengklaim berhasil.

SW memakai allowlist `pause-public-*`: hanya bantuan/fallback mandiri, font, ikon, dan representasi artikel /offline-education/. Tidak ada cache /api, /app, halaman auth, RSC/Flight, prefetch, jurnal, kontak, atau token. HTML halaman publik Next juga tidak disalin. Fallback navigasi ke halaman pribadi hanya berisi pemberitahuan umum. /bantuan/napas tetap dapat di-reload offline setelah precache berhasil. Copy panduan online dan offline berasal dari content/help.json.

Versi baru menunggu aktivasi; banner meminta tindakan “Muat ulang”. Tombol dinonaktifkan ketika panduan aktif atau form berubah. Tidak ada skipWaiting atau reload semua tab otomatis. Unduhan publik yang masih relevan dipertahankan saat aktivasi; cache versi lama kemudian dibersihkan.

Untuk debugging di browser: DevTools → Application → Service Workers → Unregister, lalu Cache Storage → hapus cache dengan prefix pause-public-. Tutup tab lama dan buka production build kembali. Tindakan ini menghapus unduhan publik, bukan database. Jangan menguji offline hanya pada dev server.

## Pengujian

```sh
npm run typecheck
npm run lint
npm test
```

API integration/E2E **menolak DATABASE_URL yang nama databasenya tidak berakhir _test**. Buat database kosong khusus, misalnya pause_test; jangan menunjuk data pengguna. Migrasikan database tersebut dengan DATABASE_URL test, pasang Chromium, build, lalu jalankan tes. APP_ORIGIN harus memakai port kosong. Test runner menjalankan production server langsung tanpa shell dan menghentikannya sesudah tes.

Contoh PowerShell dengan PostgreSQL lokal/Compose yang sudah berjalan:

```powershell
# Buat pause_test memakai createdb / psql terlebih dahulu.
$env:DATABASE_URL = 'postgresql://pause:pause_local@localhost:5433/pause_test?schema=public'
$env:APP_ORIGIN = 'http://localhost:3100'
$env:ALLOW_INSECURE_LOCAL_COOKIE = 'true'
npm.cmd run db:migrate
npx.cmd playwright install chromium
npm.cmd run build
npm.cmd run test:e2e
# Kembalikan environment shell setelah pengujian.
Remove-Item Env:DATABASE_URL, Env:APP_ORIGIN, Env:ALLOW_INSECURE_LOCAL_COOKIE
```

Lihat [konfigurasi sesi lokal](docs/local-session.md) untuk database dan port yang sudah disiapkan pada workspace ini.

Unit: validasi minimum, PATCH yang tidak mengosongkan field, batas agregat, tanggal lintas DST, dan return URL. API integration: kepemilikan, CSRF/Origin, hash/sesi tidak masuk ekspor, rollback, cascade akun, rotasi/expiry/logout. Browser: daftar → jurnal → salin rencana → ekspor → logout, demo memory, gagal simpan, 360 px, keyboard/reduced motion, manifest/ikon/install UI, offline nyata, unduhan artikel, cache allowlist, dan update SW saat panduan aktif. Screenshot ada di docs/screenshots setelah tes tampilan; laporan di playwright-report (diabaikan Git).

## Struktur dan keputusan implementasi

Next.js 16 App Router + React 19 + TypeScript; Tailwind 4 dan CSS bertoken; Prisma 7 dengan adapter PostgreSQL; Route Handlers Node.js satu origin; React Hook Form, Zod 4, TanStack Query memory, Lucide. package-lock.json mengunci versi terpasang.

- src/app: halaman, layout, manifest, REST /api/v1.
- src/features: auth, jurnal, rencana, bantuan, edukasi, workspace/demo.
- src/lib/server: DB, session/CSRF, service ownership/transaction, dan dispatcher API.
- content/education dan content/help.json: konten sumber bersama.
- prisma: schema, SQL migrasi, seed tanpa akun.
- scripts: generator offline dan template SW.
- tests: unit, API integration, E2E, dan pengelola server pengujian.

Penyesuaian dari struktur contoh brief: endpoint dikelompokkan di satu catch-all Route Handler tipis dengan service terpisah; halaman pribadi memakai catch-all dalam route group dengan pemeriksaan sesi pada layout **dan** page. Proxy hanya meneruskan path internal untuk return URL; otorisasi tetap diperiksa server dan API. Nama model Prisma camelCase dipakai secara konsisten; waktu database timestamptz UTC. Tidak ada penggantian stack.

## Privasi dan batas prototipe

Data pribadi tidak dipersist ke localStorage, IndexedDB, SW, CDN, atau analytics. Query pribadi per request, no-store; TanStack Query hanya memory dan dibersihkan saat logout/ganti akun/expiry. Perubahan sesi lintas tab menggunakan BroadcastChannel tanpa menyimpan data. Teks sensitif tidak dikirim ke LLM, tracker, atau layanan validasi nomor. Database menyimpan data aplikasi biasa; **tidak ada klaim enkripsi end-to-end**.

Rate limit memory ditujukan untuk satu instance; gunakan penyimpanan bersama sebelum menjalankan banyak instance. Reset kata sandi, verifikasi email, recovery akun, dan CMS tidak termasuk MVP. Materi serta copy medis wajib ditinjau profesional sebelum menerima pengguna nyata. Pengujian Chromium otomatis bukan sertifikasi aksesibilitas atau pengujian perangkat iOS/Android fisik.

Tidak ada backup otomatis dalam konfigurasi lokal ini. Jika hosting kemudian memakai backup, tetapkan dan informasikan retensi serta jadwal penghapusan backup sebelum menerima data nyata. Hapus akun menghapus data aktif; ekspor di perangkat pengguna tetap ada. Gunakan HTTPS dan database privat pada lingkungan hosting. Aplikasi tidak diterbitkan dalam pekerjaan ini.

Rujukan implementasi: [Next.js PWA](https://nextjs.org/docs/app/guides/progressive-web-apps), [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route), [Prisma Client](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/generating-prisma-client). Sumber edukasi tercantum pada setiap artikel. Lihat docs/progress.md untuk status verifikasi.
