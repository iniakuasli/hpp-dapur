# Panduan Lengkap Deployment DapurHitung

Dokumen ini memuat langkah-langkah lengkap dan mendetail tanpa ada yang terlewat untuk mendeploy aplikasi **DapurHitung** (HPP & Harga Jual Kuliner) ke production agar dapat diakses secara online serta di-install sebagai PWA di HP (Android/iOS).

---

## Daftar Ini
1. [Bagian 1: Setup Database & Auth (Supabase)](#bagian-1-setup-database--auth-supabase)
2. [Bagian 2: Setup Repository Git & GitHub](#bagian-2-setup-repository-git--github)
3. [Bagian 3: Deploy Frontend (Cloudflare Pages)](#bagian-3-deploy-frontend-cloudflare-pages)
4. [Bagian 4: Cara Menginstal Aplikasi sebagai PWA di HP](#bagian-4-cara-menginstal-aplikasi-sebagai-pwa-di-hp)
5. [Bagian 5: Troubleshooting (Pemecahan Masalah)](#bagian-5-troubleshooting-pemecahan-masalah)

---

## Bagian 1: Setup Database & Auth (Supabase)

Supabase digunakan sebagai backend untuk menyimpan data usaha (bahan baku, menu, overhead, dan channel) secara aman per pengguna.

### Langkah 1.1: Membuat Project di Supabase
1. Buka browser dan pergi ke [Supabase](https://supabase.com).
2. Daftar atau masuk menggunakan akun GitHub Anda.
3. Di halaman Dashboard, klik tombol **New Project**.
4. Pilih organisasi Anda (atau buat baru jika belum ada).
5. Isi formulir pembuatan project:
   - **Name**: `DapurHitung`
   - **Database Password**: Buat password yang kuat dan **simpan/catat password ini** karena akan digunakan jika Anda ingin mengakses database secara langsung nantinya.
   - **Region**: Pilih wilayah terdekat (misalnya `Singapore` untuk performa terbaik di Indonesia).
   - **Pricing Plan**: Pilih **Free** (gratis).
6. Klik **Create new project** dan tunggu beberapa menit hingga proses provisioning database selesai.

### Langkah 1.2: Menjalankan Skema SQL (Migrations)
1. Setelah project siap, lihat menu sidebar di sebelah kiri, klik ikon **SQL Editor** (ikon berbentuk lembaran dengan teks SQL).
2. Klik tombol **New Query** (atau **Quick Start** lalu pilih blank query).
3. Salin seluruh isi file skema SQL proyek ini. File SQL ada di:
   - [supabase-schema.sql](file:///c:/Users/Fiki/Documents/Nocode/hpp-dapur/docs/supabase-schema.sql) ATAU [0001_init.sql](file:///c:/Users/Fiki/Documents/Nocode/hpp-dapur/supabase/migrations/0001_init.sql).
4. Tempel (*paste*) kode SQL tersebut ke dalam editor di dashboard Supabase.
5. Klik tombol **Run** di bagian kanan bawah editor.
6. Pastikan muncul pesan sukses: `Success. No rows returned` atau daftar tabel berhasil dibuat.

### Langkah 1.3: Mengonfigurasi Metode Login (Authentication)
1. Pada sidebar kiri Supabase, klik ikon **Authentication** (ikon gembok/user).
2. Masuk ke submenu **Providers** di bawah bagian *Configuration*.
3. **Email Provider**:
   - Pastikan **Email** berstatus **Enabled** (aktif).
   - *Rekomendasi (Opsional)*: Untuk mempermudah pendaftaran pengguna di awal tanpa perlu verifikasi email masuk, matikan opsi **Confirm email** (geser tombol ke kiri). Pengguna baru akan bisa langsung login setelah mendaftar.
4. **Google Provider** (Jika ingin mengaktifkan tombol login dengan Google):
   - Klik opsi **Google**.
   - Aktifkan dengan menggeser tombol ke **Enabled**.
   - Anda perlu memasukkan **Client ID** dan **Client Secret** yang diperoleh dari Google Cloud Console.
   - Salin **Redirect URL** yang disediakan oleh Supabase dan masukkan ke dalam Authorized Redirect URIs di Google Cloud Console Anda.

### Langkah 1.4: Mengambil Kunci API (API Credentials)
1. Pada sidebar kiri Supabase, klik ikon **Project Settings** (ikon roda gigi di paling bawah).
2. Klik submenu **API**.
3. Di halaman ini, Anda akan melihat informasi penting:
   - **Project URL**: Cari nilai di kolom `Project URL` (misal: `https://xxxxxx.supabase.co`).
   - **anon/public API Key**: Cari nilai di kolom `anon public` (sebuah string panjang).
4. **Catat kedua nilai ini**, karena akan dimasukkan ke Cloudflare Pages saat proses deploy frontend.

---

## Bagian 2: Setup Repository Git & GitHub

Untuk mendeploy ke Cloudflare Pages, kode program Anda harus diunggah terlebih dahulu ke GitHub.

> [!IMPORTANT]
> Jangan menyalin persis perintah contoh yang memiliki tanda kurung siku atau placeholder seperti `<URL_REPO_GITHUB>`. Anda harus menggantinya dengan tautan asli repositori Anda.

### Langkah 2.1: Membuat Repositori di GitHub
1. Buka [GitHub](https://github.com) dan login ke akun Anda.
2. Klik tombol **New** di bagian kiri atau kunjungi [github.com/new](https://github.com/new).
3. Isi detail repositori:
   - **Repository name**: `hpp-dapur`
   - **Public/Private**: Pilih **Private** jika Anda ingin mengamankan kode Anda agar tidak dilihat orang lain, atau **Public** jika ingin membagikannya.
   - **Initialize this repository with**: **Jangan centang apapun** (jangan tambah README, .gitignore, atau license karena file tersebut sudah ada di komputer Anda).
4. Klik tombol **Create repository**.
5. Setelah repositori terbuat, salin URL repositori Anda yang berformat seperti ini:
   `https://github.com/username-anda/hpp-dapur.git`

### Langkah 2.2: Mengunggah Kode dari Lokal ke GitHub
Buka terminal (PowerShell atau Command Prompt) di folder proyek Anda (`c:\Users\Fiki\Documents\Nocode\hpp-dapur`), lalu jalankan perintah berikut secara berurutan:

```powershell
# 1. Inisialisasi Git di komputer lokal Anda (jika belum pernah)
git init

# 2. Tambahkan semua berkas ke dalam daftar tracking git
git add .

# 3. Lakukan commit pertama Anda
git commit -m "First commit: Initial codebase"

# 4. Buat branch utama dengan nama 'main'
git branch -M main

# 5. Hubungkan git lokal Anda ke repositori GitHub yang baru dibuat
# GANTI URL di bawah ini dengan URL asli yang Anda salin dari GitHub pada Langkah 2.1
git remote add origin https://github.com/username-anda/hpp-dapur.git

# 6. Unggah kode lokal Anda ke GitHub
git push -u origin main
```

---

## Bagian 3: Deploy Frontend (Cloudflare Pages)

Cloudflare Pages akan membaca kode dari GitHub, membuild-nya menjadi file statis HTML/JS, dan menyediakannya secara gratis melalui CDN global mereka.

### Langkah 3.1: Menghubungkan GitHub ke Cloudflare
1. Buka browser dan kunjungi [Cloudflare](https://dash.cloudflare.com) lalu masuk ke dashboard Anda.
2. Pada menu navigasi sebelah kiri, klik **Workers & Pages**.
3. Klik tombol **Create application** di sebelah kanan.
4. Pilih tab **Pages** (bukan Workers), lalu klik tombol **Connect to Git**.
5. Jika Anda belum pernah menghubungkan GitHub ke Cloudflare, ikuti petunjuk di layar untuk memberikan izin akses repositori ke Cloudflare. Anda bisa memilih untuk memberikan akses ke semua repositori atau hanya repositori `hpp-dapur` saja.
6. Pilih repositori **hpp-dapur** dari daftar repositori yang muncul, lalu klik **Begin setup**.

### Langkah 3.2: Konfigurasi Proyek & Parameter Build
Di halaman konfigurasi build, isi detailnya sebagai berikut:
* **Project name**: `dapurhitung` (ini akan menentukan subdomain Anda, misal `dapurhitung.pages.dev`).
* **Production branch**: `main`
* **Framework preset**: Pilih **Vite** dari pilihan dropdown.
* **Build command**: `npm run build`
* **Build output directory**: `dist`
* **Root directory**: (biarkan kosong / default `/`)

### Langkah 3.3: Memasukkan Environment Variables (SANGAT PENTING)
Agar frontend di Cloudflare Pages bisa berkomunikasi dengan Supabase Anda, Anda wajib memasukkan kredensial API yang telah Anda catat pada **Langkah 1.4**:

1. Scroll ke bagian bawah halaman build settings, klik menu dropdown **Environment variables (advanced)**.
2. Tambahkan variabel baru dengan mengklik **Add variable**:
   - **Variable Name (Key)**: `VITE_SUPABASE_URL`
   - **Value**: Masukkan URL Supabase Anda (contoh: `https://xxxxxx.supabase.co`)
3. Klik **Add variable** lagi untuk menambahkan baris kedua:
   - **Variable Name (Key)**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Masukkan anon/public API Key Supabase Anda (kunci string yang sangat panjang)

### Langkah 3.4: Deploy Proyek
1. Setelah memastikan nama variabel lingkungan ditulis dengan huruf besar secara persis, klik tombol **Save and Deploy**.
2. Cloudflare akan memulai proses unduhan kode dari GitHub, menginstal dependensi NPM, dan menjalankan proses build.
3. Proses ini biasanya memakan waktu 1–2 menit.
4. Setelah selesai, Anda akan mendapatkan pesan sukses dan tautan langsung to situs web Anda (contoh: `https://dapurhitung.pages.dev`).

---

## Bagian 4: Cara Menginstal Aplikasi sebagai PWA di HP

Aplikasi DapurHitung sudah dirancang sebagai Progressive Web App (PWA). Anda dapat menginstalnya di HP agar berfungsi seperti aplikasi native Android atau iOS.

### Cara Install di Android (Google Chrome)
1. Buka aplikasi **Google Chrome** di HP Anda.
2. Kunjungi URL Cloudflare Pages Anda (misal: `https://dapurhitung.pages.dev`).
3. Tunggu hingga halaman termuat penuh.
4. Ketuk ikon **titik tiga** di pojok kanan atas browser Chrome.
5. Pilih menu **Add to Home screen** (Tambahkan ke Layar Utama) atau **Install app**.
6. Konfirmasi dengan mengetuk **Install**. Aplikasi DapurHitung sekarang akan muncul di laci aplikasi HP Anda dengan ikon kustom.

### Cara Install di iPhone/iPad (Safari)
1. Buka aplikasi browser **Safari** bawaan iPhone.
2. Akses alamat web aplikasi Anda.
3. Ketuk tombol **Share** (ikon persegi dengan panah ke atas di bagian bawah layar).
4. Gulir ke bawah pada lembar menu opsi, lalu ketuk **Add to Home Screen** (Tambahkan ke Layar Utama).
5. Beri nama aplikasi (misal: `DapurHitung`) lalu ketuk **Add** di pojok kanan atas.
6. Aplikasi akan langsung muncul di halaman beranda iOS Anda.

---

## Bagian 5: Troubleshooting (Pemecahan Masalah)

### 1. Error saat menjalankan perintah `git remote add origin`
* **Penyebab**: Anda menyalin perintah yang menyertakan tanda kurung siku atau `<...>` dari panduan. Karakter `<` dan `>` adalah operator khusus dalam PowerShell (redirection), sehingga menyebabkan error.
* **Solusi**: Pastikan Anda memasukkan URL asli secara langsung tanpa menyertakan tanda kurung siku atau kurung lancip.
  * *Salah*: `git remote add origin <https://github.com/...>`
  * *Benar*: `git remote add origin https://github.com/...`

### 2. Layar putih saat memuat aplikasi live (White Screen / Blank Screen)
* **Penyebab**: Paling sering dikarenakan variabel lingkungan (`Environment Variables`) di Cloudflare Pages salah ketik, belum dimasukkan, atau Supabase belum dikonfigurasi dengan benar.
* **Solusi**:
  1. Buka Cloudflare Dashboard > Workers & Pages > Pilih proyek Pages Anda.
  2. Buka tab **Settings** > **Environment variables**.
  3. Periksa apakah `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sudah terdaftar dan nilainya benar.
  4. Jika Anda baru mengubah variabel lingkungan, Anda harus melakukan deploy ulang dengan cara membuka tab **Deployments** > Klik deployment terakhir > klik **Redeploy**.

### 3. Error saat pendaftaran akun: "Email confirmation is required"
* **Penyebab**: Anda mencoba login/register tetapi Supabase meminta verifikasi email, sementara Anda belum menonaktifkan fitur konfirmasi email di Supabase.
* **Solusi**: Buka dashboard Supabase > Authentication > Providers > Email. Nonaktifkan opsi **Confirm email**, lalu klik **Save**. Pengguna baru sekarang dapat langsung login setelah mendaftar tanpa harus mengecek kotak masuk email.
