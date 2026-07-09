# DapurHitung Migration Plan

Dokumen ini memetakan state aplikasi saat ini ke struktur Supabase agar migrasi dari mode lokal ke mode login-user lebih terarah.

## Sumber data saat ini

Di `src/App.jsx`, state utama masih disimpan ke `localStorage`:

- `businessName`
- `bahanList`
- `menus`
- `channels`
- `overhead`
- `selectedMenuId`

## Mapping state ke database

| State sekarang | Target tabel Supabase | Catatan |
|---|---|---|
| `businessName` | `businesses.name` | satu user satu bisnis dulu |
| `bahanList[]` | `ingredients` | `tipeMenu` disimpan sebagai `text[]` |
| `menus[]` | `menus` | margin per channel disimpan sebagai `jsonb` |
| `menus[].items[]` | `menu_items` | relasi ke `menus` dan `ingredients` |
| `channels[]` | `channels` | default channel dibuat saat signup |
| `overhead` | `overheads` | satu row per bisnis |
| `selectedMenuId` | tidak perlu disimpan di DB | cukup state UI lokal |

## Tahap migrasi yang disarankan

### Tahap 1 — Tambah auth dan database
- buat project Supabase
- jalankan SQL schema
- aktifkan email login
- aktifkan Google provider

### Tahap 2 — Pisahkan data layer dari UI
Refactor `src/App.jsx` agar:
- fungsi hitung tetap lokal
- fungsi CRUD tidak langsung menulis ke state utama
- CRUD lewat service layer

Contoh service yang nanti dibutuhkan:
- `authService`
- `profileService`
- `ingredientService`
- `menuService`
- `channelService`
- `overheadService`

### Tahap 3 — Tambah auth gate
- jika belum login, tampilkan halaman auth
- jika sudah login, baru render app utama

### Tahap 4 — Load data dari Supabase
Saat login sukses:
- ambil business user
- ambil ingredient list
- ambil menu list
- ambil menu items
- ambil channels
- ambil overhead
- bentuk ulang jadi state yang sekarang dipakai UI

### Tahap 5 — CRUD ke cloud
Ubah operasi berikut agar menulis ke Supabase:
- tambah/edit/hapus bahan
- tambah/edit/hapus menu
- tambah/edit/hapus item resep
- ubah channel
- ubah overhead
- ubah nama usaha

### Tahap 6 — Kurangi peran localStorage
Setelah cloud stabil:
- `localStorage` jangan jadi sumber data utama
- pakai hanya untuk:
  - draft offline
  - remember selected tab
  - cache ringan

## Data bootstrap user baru

Saat user baru signup/login Google pertama kali, sistem otomatis membuat:

- profile
- business default
- channel default:
  - Dine-in
  - Online
  - Katering
- overhead default

Dengan begitu user bisa langsung masuk app tanpa setup panjang.

## Risiko migrasi yang perlu dijaga

### 1. Shape data UI berbeda dengan shape database
Di UI saat ini:
- menu menyimpan `items[]` langsung di dalam object menu

Di database nanti:
- `menus` dan `menu_items` terpisah

Jadi perlu mapper dua arah:
- database -> UI state
- UI state -> payload database

### 2. ID lokal sekarang bukan UUID
Sekarang ID seperti:
- `b1`
- `m1`
- `b${Date.now()}`

Di Supabase nanti sebaiknya pakai UUID.

### 3. localStorage lama tidak otomatis sinkron
Jika user lama sudah punya data lokal, perlu dipilih salah satu:
- import manual ke akun cloud
- atau abaikan data lokal lama

## Strategi transisi paling aman

Urutan implementasi praktis:

1. auth + schema dulu
2. login gate dulu
3. load data cloud read-only dulu
4. CRUD cloud bertahap
5. backup/import cloud belakangan

## Keputusan produk yang saya sarankan

Untuk versi pertama akun-user:
- satu user satu bisnis
- belum ada staff/team member
- belum ada realtime
- belum ada sinkronisasi offline kompleks

Fokusnya:
- login stabil
- data aman per user
- UX sederhana
