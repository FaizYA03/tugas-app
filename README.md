# Aplikasi Daftar Tugas (To-Do List) Fullstack

Aplikasi manajemen tugas (to-do list) modern dengan arsitektur fullstack terpisah (monorepo): **React (Frontend)**, **Express REST API (Backend)**, dan **PostgreSQL (Database)**. Proyek ini dibangun dengan standar industri, mengedepankan keamanan query, validasi input berlapis, penanganan error terpusat, dan performa tinggi tanpa dependensi berlebih.

---

## 🚀 Fitur Utama

- **Tampilkan Daftar Tugas**: Menampilkan daftar tugas terurut dari yang paling baru (`ORDER BY id DESC`).
- **Tambah Tugas Baru**: Input terkontrol dengan validasi (tidak boleh kosong, maksimal 200 karakter) dan tombol dinonaktifkan selama proses request.
- **Centang Selesai (Toggle)**: Mengubah status tugas secara instan melalui endpoint `PATCH /api/tugas/:id/toggle`.
- **Edit Judul Inline**: Mengubah teks tugas langsung di tempat tanpa membuka modal atau halaman baru.
- **Hapus Tugas**: Konfirmasi penghapusan tugas dengan penanganan respon 200 / 404.
- **Filter Tugas**: Menyaring tampilan berdasarkan status (Semua, Aktif, Selesai) disertai kalkulasi jumlah tugas secara reaktif.
- **State & Error Handling**: Penanganan visual yang jelas untuk kondisi *loading*, pesan *error* jaringan/server dengan tombol coba lagi (*retry*), dan tampilan kosong (*empty state*).
- **Tampilan Responsif**: Desain bersih, modern, dan nyaman diakses melalui perangkat seluler (*mobile-friendly*) menggunakan CSS murni.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** (JavaScript murni, tanpa TypeScript)
- **Vite** (Build tool dan dev server ultra-cepat)
- **Fetch API** bawaan browser (terpusat di `src/services/api.js`)
- **CSS Murni** (Modern CSS variables, flexbox, mobile responsive, tanpa UI library eksternal)

### Backend
- **Node.js** & **Express.js** (RESTful API framework)
- **pg (node-postgres)**: Koneksi PostgreSQL menggunakan connection pooling (`Pool`)
- **dotenv**: Manajemen konfigurasi environment variable
- **cors**: Middleware Cross-Origin Resource Sharing

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
├── backend/
│   ├── package.json               # Dependensi & skrip backend Express
│   ├── .env.example               # Contoh konfigurasi environment backend
│   ├── schema.sql                 # DDL tabel PostgreSQL & data awal (seed)
│   ├── src/
│   │   ├── index.js               # Inisialisasi Express app, middleware, & port listener
│   │   ├── db.js                  # Setup koneksi pg.Pool & parameterized query
│   │   ├── routes/
│   │   │   └── tugas.js           # Definisi endpoint rute /api/tugas
│   │   ├── controllers/
│   │   │   └── tugasController.js # Logika penanganan request, validasi, & query DB
│   │   └── middleware/
│   │       └── errorHandler.js    # Error handler terpusat format { "message": "..." }
│   └── tests/
│       ├── smoke.sh               # Smoke test otomatis endpoint menggunakan curl
│       └── smoke.js               # Smoke test otomatis lintas platform via Node.js
└── frontend/
    ├── package.json               # Dependensi & skrip frontend React
    ├── vite.config.js             # Konfigurasi Vite
    ├── index.html                 # Entry point HTML aplikasi
    ├── .env.example               # Contoh konfigurasi URL API frontend
    └── src/
        ├── main.jsx               # Entry point React DOM
        ├── App.jsx                # Komponen induk & manajemen state aplikasi
        ├── App.css                # Styling CSS responsif
        ├── services/
        │   └── api.js             # Sentralisasi seluruh pemanggilan fetch API
        └── components/
            ├── FormTugas.jsx      # Form input tambah tugas baru
            ├── ItemTugas.jsx      # Item baris tugas (toggle, inline edit, hapus)
            └── DaftarTugas.jsx    # Render list item tugas dan empty state
```

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
   ```
4. Pasang dependensi dan jalankan server:
   ```bash
   npm install
   npm run dev
   ```
   Server backend akan aktif di: `http://localhost:3000`

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

| Metode | Endpoint | Status Sukses | Deskripsi | Status Error |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | `200 OK` | Pengecekan status server | - |
| `GET` | `/tugas` | `200 OK` | Mengambil seluruh daftar tugas (terbaru dulu) | `500` |
| `GET` | `/tugas/:id` | `200 OK` | Mengambil detail 1 tugas berdasarkan ID | `400`, `404`, `500` |
| `POST` | `/tugas` | `201 Created` | Menambahkan tugas baru | `400`, `500` |
| `PUT` | `/tugas/:id` | `200 OK` | Mengubah judul dan/atau status selesai | `400`, `404`, `500` |
| `PATCH`| `/tugas/:id/toggle` | `200 OK` | Membalikkan status selesai (true/false) | `400`, `404`, `500` |
| `DELETE`| `/tugas/:id` | `200 OK` | Menghapus tugas berdasarkan ID | `400`, `404`, `500` |

### Format Respon Error Terstandarisasi
Semua respon error memiliki format JSON konsisten:
```json
{
  "message": "Pesan deskripsi kesalahan"
}
```

### Contoh Permintaan (cURL)

#### 1. Tambah Tugas Baru
```bash
curl -X POST http://localhost:3000/api/tugas \
  -H "Content-Type: application/json" \
  -d '{"judul": "Belajar konsep React State dan Hooks"}'
```

#### 2. Toggle Status Selesai
```bash
curl -X PATCH http://localhost:3000/api/tugas/1/toggle
```

#### 3. Edit Judul Tugas
```bash
curl -X PUT http://localhost:3000/api/tugas/1 \
  -H "Content-Type: application/json" \
  -d '{"judul": "Belajar konsep React State dan Hooks (Selesai)"}'
```

#### 4. Hapus Tugas
```bash
curl -X DELETE http://localhost:3000/api/tugas/1
```

---

## 🧪 Pengujian Otomatis (Smoke Test)

Tersedia script smoke test untuk menguji seluruh rute dan validasi error secara otomatis:

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
