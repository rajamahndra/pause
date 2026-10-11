# Konfigurasi lokal pada sesi implementasi

Folder kerja: D:\PROJECT\DEVnBLUES\Pause.

Docker daemon belum aktif, sehingga verifikasi menggunakan binary PostgreSQL 16 yang sudah terpasang. Cluster khusus proyek berada di .test-db (diabaikan Git), bind 127.0.0.1:55432, pengguna database pause_test. Cluster ini memiliki dua database terpisah: pause_test untuk pengujian dan pause_local untuk pengembangan. Database pengembangan telah dimigrasikan.

.env lokal mengarah ke pause_local dan APP_ORIGIN=http://localhost:3000. Origin ini harus sama dengan alamat yang dibuka di browser; perbedaan port menyebabkan registrasi/login ditolak (403). PostgreSQL khusus proyek masih berjalan. Untuk membuka aplikasi:

```powershell
npm.cmd run dev
```

Buka http://localhost:3000 atau http://localhost:3000/demo. Development tidak meregistrasikan service worker. Untuk memeriksa PWA gunakan build/start:

```powershell
npm.cmd run build
npm.cmd run start
```

Jika PostgreSQL proyek belum berjalan setelah restart komputer, dari folder Pause:

```powershell
$pauseData = Join-Path (Get-Location) '.test-db'
Start-Process -FilePath 'C:\Program Files\PostgreSQL\16\bin\postgres.exe' -ArgumentList '-D', $pauseData, '-p', '55432', '-h', '127.0.0.1' -WindowStyle Hidden
```

Cluster ini memakai trust pada loopback untuk pengembangan lokal, bukan konfigurasi hosting. Akun aplikasi tetap memakai password Argon2id dan sesi cookie. Untuk mesin baru, gunakan langkah Docker/.env.example pada README.

Untuk mengulang E2E, set DATABASE_URL shell ke postgresql://pause_test@127.0.0.1:55432/pause_test?schema=public dan APP_ORIGIN=http://localhost:3100 (port kosong), lalu jalankan npm.cmd run test:e2e. Runner menolak database yang namanya tidak berakhir _test. Hapus override environment shell sesudah tes agar development kembali memakai .env.
