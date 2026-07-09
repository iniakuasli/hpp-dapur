# DapurHitung

Aplikasi HPP dan harga jual kuliner berbasis React + Vite + PWA.

## Fitur

- Master bahan baku
- Resep/menu per kategori
- Perhitungan HPP + overhead
- Harga jual per channel
- SOP resep siap print
- Laporan siap print/PDF
- Backup dan restore data JSON
- Penyimpanan lokal di perangkat (`localStorage`)
- Bisa di-install ke Android/iPhone sebagai PWA

## Jalankan lokal

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
```

Folder hasil build ada di `dist/`.

## Deploy gratis paling mudah

### Opsi yang direkomendasikan: Cloudflare Pages

Project ini sudah disiapkan untuk Cloudflare Pages dengan file berikut:

- `public/_headers` untuk cache dan header dasar
- `public/_redirects` untuk fallback SPA
- `.nvmrc` untuk Node 20

#### Langkah deploy

1. Push project ini ke GitHub.
2. Login ke Cloudflare Dashboard.
3. Buka **Workers & Pages** > **Create application** > **Pages**.
4. Connect ke repository GitHub.
5. Gunakan setting build berikut:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: `20`
6. Deploy.
7. Anda akan mendapatkan subdomain gratis `*.pages.dev`.

#### Kenapa file Cloudflare ini penting

- `_headers` membuat asset hasil build lebih cache-friendly
- `_redirects` menjaga app tetap berjalan jika nanti menambah client-side routing
- `.nvmrc` membantu menyamakan versi Node lokal dan build server

## Instal sebagai app di HP

### Android
- Buka URL aplikasi di Chrome
- Tap menu browser
- Pilih **Add to Home screen** atau **Install app**

### iPhone
- Buka URL aplikasi di Safari
- Tap tombol **Share**
- Pilih **Add to Home Screen**

## Login user dengan email/Google

Implementasi dasar auth sudah disiapkan di frontend.

Dokumen dan file Supabase terkait ada di:

- `docs/supabase-schema.sql`
- `docs/supabase-auth-flow.md`
- `docs/migration-plan.md`
- `.env.example`

Model yang dipakai saat ini:
- user daftar/login dengan email atau Google
- setiap user hanya melihat data miliknya sendiri
- satu user satu bisnis dulu untuk versi pertama

### Langkah aktivasi Supabase

1. Buat project di Supabase.
2. Jalankan isi file `docs/supabase-schema.sql` di SQL Editor Supabase.
3. Aktifkan provider:
   - Email
   - Google
4. Tambahkan redirect URL:
   - `http://localhost:5173`
   - `https://namaproject.pages.dev`
5. Copy `.env.example` menjadi `.env` lalu isi:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

6. Jalankan app lokal:

```bash
npm run dev
```

Jika env Supabase belum diisi, aplikasi otomatis tetap berjalan dalam mode lokal.

## Catatan penting

- Data saat ini disimpan lokal di device user.
- Jika browser dibersihkan atau device diganti, data bisa hilang.
- Gunakan fitur **Backup JSON** untuk cadangan manual.
- Arsitektur ini cocok untuk target biaya 0 Rupiah.
