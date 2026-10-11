# Arsitektur dan privasi

Semua mutasi REST memeriksa Origin; mutasi terautentikasi juga memeriksa hash token CSRF sesi. Cookie menyimpan token acak 256 bit; database menyimpan SHA-256 token dan SHA-256 token CSRF turunan. CSRF turunannya tidak membuka token cookie. Argon2id: memory 19 MiB, time cost 2, parallelism 1. Login merotasi sesi saat ini. Sesi berlaku tujuh hari.

Beranda pengguna dengan sesi valid adalah /app. Halaman /, auth, dan demo memeriksa sesi di server sebelum merender; auth hanya mengizinkan returnTo internal /app. Cookie yang tidak valid atau kedaluwarsa tidak memicu redirect ke ruang pribadi. Header/footer publik menyesuaikan tautan berdasarkan sesi tanpa mengirim token atau profil ke komponen navigasi. Perubahan login/logout lewat BroadcastChannel memuat ulang tab lain agar tampilan tamu dan akun tidak tertukar.

Daftar edukasi dan detail artikel memakai WorkspaceShell yang sama dengan halaman akun ketika sesi aktif. PublicShell hanya menerima status login dari layout server; menu tidak membutuhkan profil, token, atau WorkspaceProvider. Halaman edukasi tetap menyediakan satu elemen main, memakai sidebar di desktop dan navigasi bawah di ponsel. Pengunjung tanpa akun tetap dapat membaca artikel melalui navigasi publik.

Ownership memakai userId dari sesi, bukan body/URL pengguna. Jurnal asing menghasilkan 404 pada baca/edit/hapus. Rencana/kontak hanya diakses sebagai agregat akun aktif; tidak ada endpoint untuk membuka kontak milik orang lain. Prisma SQL tersusun dengan parameter, termasuk filter COALESCE waktu pengalaman/tanggal pembuatan. Rentang inklusif dihitung sebagai awal hari lokal hingga awal hari sesudah tanggal akhir, memakai Temporal dan zona IANA.

Jurnal + actions dan rencana + steps/contacts disimpan atomik dalam transaksi. PATCH memvalidasi hasil gabungan lama + field terkirim; null menghapus field nullable. Actions hanya diganti jika dikirim. Rencana PUT merupakan snapshot lengkap. Penambahan dari jurnal membaca snapshot rencana terbaru dan menyimpan teks salinan yang dikonfirmasi. Penyuntingan serentak dari banyak tab belum memiliki UI resolusi konflik; penyimpanan terakhir berlaku.

Ekspor mengambil profil minimum, preferensi, jurnal, dan rencana dalam transaksi. Hash, sesi, dan token tidak diserialisasi. Penghapusan akun merupakan transaksi dengan foreign-key cascade; kata sandi dan konfirmasi HAPUS wajib. Tes menyimulasikan kegagalan transaksi untuk memastikan data tidak dihapus sebagian.

PWA tidak memiliki akses ke database atau sesi. Precache harus seluruhnya berhasil agar worker terpasang. Status offline-ready memeriksa keberadaan semua aset. Artikel disimpan hanya lewat pesan download dari halaman same-origin, slug allowlist, fetch credentials omit, response 200 tanpa redirect. Cache versi menggunakan hash template dan isi aset; aktivasi menunggu tindakan pengguna atau semua tab versi lama ditutup secara alami.

Navigasi HTML yang gagal mendapat bantuan mandiri bila route bantuan, artikel unduhan bila tersedia, atau fallback umum. Request API/mutasi/RSC/prefetch tidak diberi respons HTML palsu. Cache asset bantuan memakai allowlist exact path; tidak ada cache-all terhadap bundle Next. Update tidak memaksa reload tab lain. Form dan panduan aktif menonaktifkan tombol update di UI.

Tidak ada analytics, pelaporan error eksternal, atau log body request. Kesalahan internal memberikan pesan umum. Rate limit memori dan pengecualian cookie HTTP lokal didokumentasikan pada README. Backup/enkripsi disk bergantung lingkungan hosting, belum dikonfigurasi di sini.
