# Aplikasi Daftar Tugas (To-Do List) Fullstack

[![CI](https://github.com/FaizYA03/tugas-app/actions/workflows/ci.yml/badge.svg)](https://github.com/FaizYA03/tugas-app/actions/workflows/ci.yml)
[![Demo](https://github.com/FaizYA03/tugas-app/actions/workflows/pages-demo.yml/badge.svg)](https://faizya03.github.io/tugas-app/)
[![Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/FaizYA03/tugas-app)

Aplikasi manajemen tugas (to-do list) modern dengan arsitektur fullstack terpisah (monorepo): **React (Frontend)**, **Express REST API (Backend)**, dan **PostgreSQL (Database)**. Proyek ini dibangun dengan standar industri, mengedepankan keamanan query, validasi input berlapis, penanganan error terpusat, dan performa tinggi tanpa dependensi berlebih.

---

## 🌐 Coba Online (Tanpa Install)

| Cara | Cocok untuk | Langkah |
| :--- | :--- | :--- |
| **Live demo** (GitHub Pages) | Klik-klik cepat | Buka **https://faizya03.github.io/tugas-app/** — frontend berjalan dalam **mode demo**: API disimulasikan di browser, data tersimpan di `localStorage`. Login dengan `demo@example.com` / `demo1234` atau daftar akun baru. |
| **Codespaces** (fullstack asli) | Mencoba API + database sungguhan | Di halaman repo klik **Code ▸ Codespaces ▸ Create codespace**, tunggu setup otomatis, lalu jalankan `cd backend && npm run dev` (terminal 1) dan `cd frontend && npm run dev` (terminal 2). |
| **Deploy backend sendiri** | Demo permanen fullstack | Deploy `backend/` + Postgres ke Render/Railway/Fly (atau VPS), isi `VITE_API_URL` frontend dengan URL API tersebut, lalu build & host `frontend/` di Vercel/Netlify/GitHub Pages (mode normal, bukan demo). |

> Mengaktifkan live demo dari nol: push branch utama, lalu **Settings ▸ Pages ▸ Build and deployment ▸ Source: GitHub Actions**. Workflow `Demo (GitHub Pages)` akan membuild otomatis di setiap push.

---

## 🖼 Tampilan

<div align="center">

| Tema Terang | Tema Gelap |
| :---: | :---: |
| <img src="docs/screenshot.png" alt="Tampilan tema terang" width="430"> | <img src="docs/screenshot-dark.png" alt="Tampilan tema gelap" width="430"> |

| Mobile (360px) | Mobile (360px) |
| :---: | :---: |
| <img src="docs/screenshot-mobile.png" alt="Tampilan mobile tema terang" width="230"> | <img src="docs/screenshot-mobile-dark.png" alt="Tampilan mobile tema gelap" width="230"> |

</div>

<details>
<summary>Tampilan tablet dan state error</summary>

**Tablet (768px)**

<img src="docs/screenshot-tablet.png" alt="Tampilan tablet 768px" width="460">

**State error saat backend tidak terjangkau**

<img src="docs/screenshot-error.png" alt="Tampilan error" width="460">

</details>

---

## 🚀 Fitur Utama

- **Autentikasi JWT**: Daftar/masuk dengan email + kata sandi (bcrypt hash, cost 10). Setiap pengguna hanya melihat dan mengelola daftar tugas miliknya sendiri. Token disimpan di `localStorage`, sesi kedaluwarsa otomatis mengeluarkan pengguna. Akun demo: `demo@example.com` / `demo1234`.
- **Tampilkan Daftar Tugas**: Pagination server-side (10 per halaman) dengan info "Halaman X dari Y".
- **Pencarian & Sortir Server-Side**: Cari judul (`q`, case-insensitive), filter status + prioritas, dan urutkan (Terbaru / Terlama / Tenggat / Prioritas) — semua dijalankan di database, bukan di browser.
- **Prioritas & Tenggat**: Setiap tugas punya prioritas (Rendah/Sedang/Tinggi) dan tanggal tenggat opsional, lengkap dengan badge warna dan label relatif ("Hari ini", "Besok", "Terlambat 2 hari").
- **Toggle Optimistis**: Status selesai dibalik seketika di UI lalu disinkronkan; otomatis dikembalikan bila request gagal.
- **Tambah Tugas Baru**: Input terkontrol dengan validasi (tidak boleh kosong, maksimal 200 karakter) dan tombol dinonaktifkan selama proses request.
- **Edit Inline**: Mengubah judul, prioritas, dan tenggat langsung di tempat tanpa membuka modal atau halaman baru. Enter untuk menyimpan, Escape untuk membatalkan.
- **Hapus Tugas**: Konfirmasi penghapusan di dalam baris tugas dengan penanganan respon 200 / 404.
- **Filter Tugas**: Menyaring tampilan berdasarkan status (Semua, Belum, Selesai) dengan jumlah per kategori yang dihitung server.
- **State & Error Handling**: Penanganan visual yang jelas untuk kondisi *loading*, pesan *error* jaringan/server dengan tombol coba lagi (*retry*), dan tampilan kosong (*empty state*) termasuk pesan khusus "tidak ada hasil pencarian".
- **Tampilan Responsif**: Desain bersih, modern, dan nyaman diakses melalui perangkat seluler (*mobile-friendly*) menggunakan CSS murni.

---

## 🎨 Fitur UI

Antarmuka dirancang ulang dengan pendekatan *design token*: semua nilai warna, tipografi, spasi, radius, bayangan, dan transisi didefinisikan sebagai CSS custom properties di `frontend/src/styles/tokens.css`, lalu dikonsumsi oleh komponen. Tidak ada library UI, framework CSS, atau pustaka ikon — hanya CSS biasa dan SVG inline.

- **Tema Terang & Gelap**: Mengikuti `prefers-color-scheme` secara default. Tombol pengalih tema di header menimpa pilihan itu dan menyimpannya di `localStorage` (dibungkus `try/catch` agar aman di mode privat). Skrip kecil di `index.html` menerapkan tema tersimpan sebelum render pertama supaya tidak ada kedipan warna.
- **Ringkasan Progres**: "X dari Y tugas selesai" dengan progress bar tipis dan angka rata-rata tabular.
- **Filter Segmented**: Kontrol *segmented* (Semua / Belum / Selesai) lengkap dengan jumlah per kategori; status aktif disampaikan lewat `aria-pressed`.
- **State Loading**: *Skeleton* beranimasi shimmer menggantikan spinner, sehingga tata letak tidak melompat.
- **State Kosong**: Ilustrasi SVG inline dan pesan yang berbeda untuk tiap filter.
- **State Error**: Banner dengan tombol "Coba lagi". Empty state sengaja disembunyikan saat gagal memuat agar tidak menyesatkan.
- **Toast**: Umpan balik singkat untuk aksi berhasil/gagal di area `aria-live`, tidak menutupi konten penting.
- **Konfirmasi Hapus**: Konfirmasi ringan di dalam baris ("Ya, hapus" / "Batal") menggantikan `window.confirm`, dengan fokus otomatis ke tombol konfirmasi.
- **Edit Inline**: Enter untuk menyimpan, Escape untuk membatalkan.
- **Responsif**: Diuji pada 360px, 768px, dan 1280px tanpa overflow horizontal.
- **Aksesibilitas**:
  - Struktur semantik `header`, `main`, `section`, `ul`/`li`, `label`, dan `button`.
  - Cincin fokus `:focus-visible` yang konsisten di seluruh kontrol.
  - Target sentuh minimal 40×40px, termasuk ikon edit dan hapus yang memakai SVG inline dengan `aria-label`.
  - Status tidak hanya mengandalkan warna: tugas selesai memakai coretan teks, warna, dan keterangan untuk pembaca layar.
  - Animasi dihormati melalui `prefers-reduced-motion`.

### Struktur CSS

| File | Isi |
| :--- | :--- |
| `src/styles/tokens.css` | Design token, tema terang/gelap, reset, primitif tombol & input, utilitas |
| `src/styles/layout.css` | Kerangka aplikasi: kanvas, kartu, pembatas bagian, footer |
| `src/components/*.css` | Gaya per komponen, letak berdampingan dengan `.jsx`-nya |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** (JavaScript murni, tanpa TypeScript)
- **Vite** (Build tool dan dev server ultra-cepat)
- **Fetch API** bawaan browser (terpusat di `src/services/api.js`)
- **CSS Murni** (*design token* sebagai custom properties, flexbox, tema gelap, responsif, tanpa UI library eksternal)

### Backend
- **Node.js** & **Express.js** (RESTful API framework)
- **pg (node-postgres)**: Koneksi PostgreSQL menggunakan connection pooling (`Pool`)
- **bcryptjs**: Hash kata sandi (cost 10, tidak pernah menyimpan password mentah)
- **jsonwebtoken**: Token sesi JWT (`Authorization: Bearer <token>`)
- **helmet** & **express-rate-limit**: Header keamanan HTTP + batas request (global & khusus auth anti brute-force)
- **dotenv**: Manajemen konfigurasi environment variable
- **cors**: Middleware Cross-Origin Resource Sharing (whitelist via `FRONTEND_URL`)
- **supertest + node:test**: Pengujian API otomatis (`npm test`)

### Database
- **PostgreSQL**: Relational database tanpa ORM
- **Parameterized Queries**: Menggunakan placeholder `$1`, `$2` untuk proteksi total dari SQL Injection

---

## 📐 Arsitektur & Diagram Alur

```mermaid
flowchart LR
    A["Frontend\n(React + Vite)"] -->|"HTTP Request\n(JSON payload)"| B["Backend REST API\n(Express.js)"]
    B -->|"Validasi Input &\nParameterized Query"| C[("Database\n(PostgreSQL)")]
    C -->|"Result Rows"| B
    B -->|"HTTP Response\n(JSON 200/201/400/404)"| A
```

### Alur Eksekusi Data (Misal: Tambah Tugas)
1. Pengguna mengetik judul tugas pada formulir di komponen `FormTugas.jsx`.
2. Formulir memvalidasi input secara lokal (mencegah string kosong dan memotong spasi luar/trim).
3. `App.jsx` memanggil fungsi `createTugas(judul)` pada `src/services/api.js`.
4. `api.js` mengirimkan HTTP request `POST /api/tugas` dengan body `{ "judul": "..." }`.
5. Server Express menerima request:
   - Middleware `cors` memverifikasi origin.
   - Middleware `express.json` mem-parsing request body.
   - `tugasController.create` memvalidasi tipe data dan panjang karakter.
   - `db.query` mengeksekusi `INSERT INTO tugas (judul) VALUES ($1) RETURNING *` via parameterized query.
6. PostgreSQL menyimpan data dan mengembalikan baris yang baru dibuat.
7. Express mengirimkan status code `201 Created` beserta objek tugas baru.
8. Frontend memperbarui state secara *immutable*: `setDaftarTugas(prev => [tugasBaru, ...prev])` sehingga UI langsung ter-render ulang tanpa perlu refresh halaman.

---

## 📂 Struktur Monorepo

```text
tugas-app/
├── README.md                      # Dokumentasi komprehensif proyek
├── .gitignore                     # Aturan pengabaian file sensitif & build
├── docker-compose.yml             # Orkestrasi Postgres + Backend + Frontend
├── backend/
│   ├── Dockerfile                 # Image backend (Node 20 Alpine)
│   ├── package.json               # Dependensi & skrip backend Express
│   ├── .env.example               # Contoh konfigurasi environment backend
│   ├── schema.sql                 # DDL lengkap (users + tugas) & seed demo
│   ├── migrations/
│   │   └── 002_auth_prioritas_tenggat.sql  # Migrasi untuk database lama
│   ├── src/
│   │   ├── index.js               # Express app: helmet, CORS whitelist, rate-limit
│   │   ├── db.js                  # pg.Pool + fallback memori + listTugas (filter/sort/page)
│   │   ├── routes/
│   │   │   ├── tugas.js           # Definisi rute /api/tugas (wajib auth)
│   │   │   └── auth.js            # Definisi rute /api/auth
│   │   ├── controllers/
│   │   │   ├── tugasController.js # CRUD scoped per user, validasi, pagination
│   │   │   └── authController.js  # Register/login/me (bcrypt + JWT)
│   │   └── middleware/
│   │       ├── auth.js            # Verifikasi Bearer token → req.user
│   │       └── errorHandler.js    # Error handler terpusat format { "message": "..." }
│   └── tests/
│       ├── api.test.js            # Automated test (node:test + supertest, 19 kasus)
│       ├── smoke.sh               # Smoke test otomatis endpoint menggunakan curl
│       └── smoke.js               # Smoke test otomatis lintas platform via Node.js
└── frontend/
├── package.json               # Dependensi & skrip frontend React
    ├── Dockerfile                 # Build statis + nginx (proxy /api)
    ├── nginx.conf                 # Konfigurasi nginx untuk Docker
    ├── vite.config.js             # Konfigurasi Vite
    ├── index.html                 # Entry point HTML + skrip pre-paint tema
    ├── .env.example               # Contoh konfigurasi URL API frontend
    └── src/
        ├── main.jsx               # Entry point React DOM
        ├── App.jsx                # Induk: auth gate, debounce search, optimistic toggle
        ├── styles/
        │   ├── tokens.css         # Design token, tema terang/gelap, base & primitif
        │   └── layout.css         # Kerangka halaman, kartu, dan footer
        ├── services/
        │   └── api.js             # Fetch terpusat + token JWT + 401 auto-logout
        ├── utils/
        │   └── tanggal.js         # Label tenggat relatif & format input date
        └── components/
            ├── Auth.jsx           # Layar masuk/daftar (tab)
            ├── Header.jsx         # Judul, tanggal, info user + keluar, tema
            ├── ThemeToggle.jsx    # Toggle tema terang/gelap + localStorage
            ├── ProgressBar.jsx    # Ringkasan "X dari Y tugas selesai"
            ├── FormTugas.jsx      # Form tambah: judul + prioritas + tenggat
            ├── FilterTabs.jsx     # Segmented control filter + jumlah per kategori
            ├── Toolbar.jsx        # Pencarian + sortir + filter prioritas
            ├── DaftarTugas.jsx    # Render list, skeleton, dan empty state
            ├── ItemTugas.jsx      # Baris tugas (badge, inline edit, konfirmasi hapus)
            ├── Pagination.jsx     # Navigasi "Halaman X dari Y"
            ├── EmptyState.jsx     # Pesan kosong per filter/pencarian + ilustrasi SVG
            ├── Skeleton.jsx       # Placeholder shimmering saat memuat
            ├── ErrorBanner.jsx    # Banner error + tombol coba lagi
            └── Toast.jsx          # Notifikasi singkat di area aria-live
```

Setiap komponen `.jsx` memiliki file `.css` dengan nama yang sama di direktori yang sama.

---

## ⚙️ Persyaratan Sistem & Instalasi

### Prasyarat
- **Node.js**: Minimal versi 18.x (direkomendasikan versi 20+)
- **Git**
- **PostgreSQL**: Minimal versi 14+ (pastikan server service aktif)

---

### Langkah 1: Persiapan Database PostgreSQL

Buka terminal dan buat database baru bernama `tugas_db`:

```bash
# Di Linux Mint / Ubuntu
sudo -u postgres psql -c "CREATE DATABASE tugas_db;"

# Eksekusi schema tabel dan seed data
sudo -u postgres psql -d tugas_db -f backend/schema.sql
```

*Jika menggunakan Windows:*
```bash
psql -U postgres -c "CREATE DATABASE tugas_db;"
psql -U postgres -d tugas_db -f backend/schema.sql
```

---

### Langkah 2: Konfigurasi & Menjalankan Backend

1. Masuk ke direktori `backend`:
   ```bash
   cd backend
   ```
2. Salin template `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   # Di Windows Command Prompt / PowerShell:
   # copy .env.example .env
   ```
3. Buka file `.env` dan sesuaikan kredensial PostgreSQL Anda:
    ```env
    PORT=3000
    DATABASE_URL=postgresql://USER_KAMU:PASSWORD_KAMU@localhost:5432/tugas_db

    # Rahasia JWT (WAJIB diganti di produksi, minimal 32 karakter acak)
    JWT_SECRET=ganti-dengan-secret-acak-minimal-32-karakter
    JWT_EXPIRES_IN=7d

    # Origin frontend yang diizinkan (CORS whitelist)
    FRONTEND_URL=http://localhost:5173
    ```
    > Database yang dibuat dengan versi lama (tanpa tabel `users`) perlu
    > dimigrasi dulu: `psql -d tugas_db -f backend/migrations/002_auth_prioritas_tenggat.sql`
    > lalu tetapkan `user_id` untuk baris lama, atau buat ulang dari `schema.sql`.
4. Pasang dependensi dan jalankan server:
    ```bash
    npm install
    npm run dev
    ```
    Server backend akan aktif di: `http://localhost:3000`

    Tanpa `DATABASE_URL` (atau bila PostgreSQL belum jalan), backend otomatis
    memakai store memori bawaan — cukup untuk mencoba UI dan menjalankan test.

---

### Langkah 3: Konfigurasi & Menjalankan Frontend

1. Buka tab terminal baru, masuk ke direktori `frontend`:
   ```bash
   cd frontend
   ```
2. Salin template `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   # Di Windows Command Prompt / PowerShell:
   # copy .env.example .env
   ```
3. Pasang dependensi dan jalankan server pengembangan Vite:
   ```bash
   npm install
   npm run dev
   ```
4. Buka browser dan akses URL lokal: `http://localhost:5173`

---

## 📡 Dokumentasi REST API

Base URL: `http://localhost:3000/api`

Semua rute `/tugas` wajib menyertakan header `Authorization: Bearer <token>` (diperoleh dari register/login). Tanpa token → `401`.

### Auth

| Metode | Endpoint | Status Sukses | Deskripsi | Status Error |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | `201 Created` | Daftar akun `{ nama, email, password }` → `{ user, token }` | `400`, `409` |
| `POST` | `/auth/login` | `200 OK` | Masuk `{ email, password }` → `{ user, token }` | `400`, `401` |
| `GET` | `/auth/me` | `200 OK` | Profil pengguna dari token aktif | `401` |

### Tugas

| Metode | Endpoint | Status Sukses | Deskripsi | Status Error |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | `200 OK` | Pengecekan status server | - |
| `GET` | `/tugas` | `200 OK` | Daftar tugas milik pengguna + pagination (lihat parameter) | `400`, `401` |
| `GET` | `/tugas/:id` | `200 OK` | Mengambil detail 1 tugas berdasarkan ID | `400`, `401`, `404` |
| `POST` | `/tugas` | `201 Created` | Menambahkan tugas `{ judul, prioritas?, tenggat? }` | `400`, `401` |
| `PUT` | `/tugas/:id` | `200 OK` | Mengubah judul / selesai / prioritas / tenggat | `400`, `401`, `404` |
| `PATCH`| `/tugas/:id/toggle` | `200 OK` | Membalikkan status selesai (true/false) | `400`, `401`, `404` |
| `DELETE`| `/tugas/:id` | `200 OK` | Menghapus tugas berdasarkan ID | `400`, `401`, `404` |

`prioritas` ∈ `rendah | sedang | tinggi` (default `sedang`). `tenggat` berupa tanggal `YYYY-MM-DD` atau `null` untuk menghapus.

#### Parameter GET /tugas

| Param | Nilai | Default |
| :--- | :--- | :--- |
| `status` | `semua` \| `aktif` \| `selesai` | `semua` |
| `q` | kata kunci pencarian judul (maks 100 karakter) | — |
| `prioritas` | `semua` \| `rendah` \| `sedang` \| `tinggi` | `semua` |
| `sort` | `terbaru` \| `terlama` \| `tenggat` \| `prioritas` | `terbaru` |
| `page` | bilangan bulat ≥ 1 | `1` |
| `limit` | bilangan bulat 1–100 | `10` |

#### Format respons GET /tugas

```json
{
  "data": [ { "id": 1, "judul": "...", "selesai": false, "prioritas": "tinggi", "tenggat": "2026-12-31", "dibuat_pada": "...", "diperbarui_pada": "..." } ],
  "pagination": { "page": 1, "limit": 10, "total": 42, "totalHalaman": 5 },
  "counts": { "semua": 42, "aktif": 30, "selesai": 12 }
}
```

### Format Respon Error Terstandarisasi
Semua respon error memiliki format JSON konsisten:
```json
{
  "message": "Pesan deskripsi kesalahan"
}
```

### Contoh Permintaan (cURL)

#### 1. Daftar & Masuk
```bash
# Daftar (sekaligus menerima token)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nama":"Budi","email":"budi@example.com","password":"rahasia123"}'

# Masuk
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"budi@example.com","password":"rahasia123"}'

# Simpan token dari respon, lalu pakai di setiap request:
TOKEN="<token-dari-respon>"
```

#### 2. Tambah Tugas Baru (dengan prioritas & tenggat)
```bash
curl -X POST http://localhost:3000/api/tugas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"judul": "Belajar konsep React State dan Hooks", "prioritas": "tinggi", "tenggat": "2026-10-12"}'
```

#### 3. Cari + Pagination
```bash
curl "http://localhost:3000/api/tugas?q=react&status=aktif&sort=tenggat&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### 4. Toggle Status Selesai
```bash
curl -X PATCH http://localhost:3000/api/tugas/1/toggle \
  -H "Authorization: Bearer $TOKEN"
```

#### 5. Edit Tugas (judul, prioritas, tenggat)
```bash
curl -X PUT http://localhost:3000/api/tugas/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"judul": "Belajar konsep React State dan Hooks (Selesai)", "prioritas": "sedang", "tenggat": null}'
```

#### 6. Hapus Tugas
```bash
curl -X DELETE http://localhost:3000/api/tugas/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🧪 Pengujian Otomatis

Pengujian API (`node:test` + `supertest`, 19 kasus: auth, isolasi antar-user, CRUD, search/filter/sort/pagination). Berjalan di atas mock DB sehingga tidak butuh PostgreSQL:

```bash
cd backend
npm test
```

Pengujian simulasi frontend mode demo (tanpa browser):

```bash
cd frontend
npm test
```

Smoke test endpoint terhadap server yang sedang berjalan:

```bash
cd backend

# Menjalankan smoke test berbasis bash/curl
npm run smoke
# atau: bash tests/smoke.sh

# Menjalankan smoke test lintas platform berbasis Node.js
npm run test:smoke
# atau: node tests/smoke.js
```

---

## 🐳 Menjalankan dengan Docker Compose

Satu perintah untuk seluruh stack (PostgreSQL + Backend + Frontend). Skema database diinisialisasi otomatis dari `backend/schema.sql` saat volume masih kosong:

```bash
# Dari direktori root proyek
JWT_SECRET="isi-secret-acak-minimal-32-karakter" docker compose up --build
```

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:3000/api`
- Login demo: `demo@example.com` / `demo1234`

---

## 💡 Konsep Penting & Catatan Teknis (Persiapan Interview)

1. **Kenapa Memakai Parameterized Query?**
   Dalam `backend/src/controllers/tugasController.js`, semua query SQL menggunakan parameter `$1`, `$2`, dll., alih-alih penggabungan string (*string concatenation*). Hal ini memisahkan struktur query dari data masukan pengguna, sehingga database driver mem-parsing kode SQL terlebih dahulu sebelum mengikat nilai data. Teknik ini mencegah serangan **SQL Injection** secara mutlak.

2. **Kenapa State di React Diganti dengan Array Baru (Immutability)?**
   React mendeteksi perubahan state menggunakan perbandingan referensi (*shallow comparison* `Object.is`). Jika kita memutasi array langsung (`state.push()` atau `state[0].selesai = true`), referensi memori array tidak berubah sehingga React tidak akan memicu *re-render* komponen. Dengan membuat array baru menggunakan `[newItem, ...prev]` atau `prev.map(...)`, referensi baru dibuat dan React menjamin rendering UI tetap sinkron dan bebas *bug*.

3. **Apa Fungsi Middleware CORS?**
   Secara default, browser menerapkan kebijakan *Same-Origin Policy* yang memblokir permintaan HTTP antar origin berbeda (misalnya frontend di `http://localhost:5173` memanggil backend di `http://localhost:3000`). Paket `cors` menambahkan header HTTP `Access-Control-Allow-Origin` pada respon Express agar browser mengizinkan frontend mengakses API dengan aman.

4. **Penanganan Error Terpusat (*Centralized Error Handling*)**
   Alih-alih mengulang blok `res.status(500).json(...)` di setiap endpoint, semua error diteruskan melalui `next(error)` ke middleware `backend/src/middleware/errorHandler.js`. Ini memastikan logging konsisten, mencegah kebocoran informasi teknis server ke pengguna luar, dan menjamin format respon `{ "message": "..." }` selalu seragam di seluruh aplikasi.

---

## 📄 Lisensi

Proyek ini dibuat untuk kebutuhan portofolio pengembangan web fullstack oleh **Muhammad Faizin** ([@FaizYA03](https://github.com/FaizYA03)). Bebas digunakan dan dimodifikasi untuk tujuan pembelajaran.
