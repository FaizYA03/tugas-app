/**
 * Simulasi REST API di dalam browser untuk MODE DEMO (tayang di GitHub Pages
 * tanpa backend). Seluruh fungsi memiliki tanda tangan dan bentuk respons
 * yang IDENTIK dengan services/api.js, sehingga App.jsx tidak perlu berubah.
 *
 * Data disimpan di localStorage (atau memori bila storage diblokir) dan
 * TIDAK PERNAH dikirim ke server mana pun. Kata sandi demo disimpan apa
 * adanya — jangan memakai kredensial asli di mode ini.
 */

const DB_KEY = 'daftar-tugas:demo-db-v1';
const TOKEN_KEY = 'daftar-tugas:token';

// Jeda buatan agar terasa seperti request jaringan sungguhan
const JEDA_MS = 120;
const tunda = (ms = JEDA_MS) => new Promise((selesai) => setTimeout(selesai, ms));

// Penyimpanan dengan fallback memori (mode privat / Node.js saat testing)
const memori = new Map();
const penyimpanan = (() => {
  try {
    localStorage.setItem('__cek_demo__', '1');
    localStorage.removeItem('__cek_demo__');
    return {
      get: (kunci) => localStorage.getItem(kunci),
      set: (kunci, nilai) => localStorage.setItem(kunci, String(nilai)),
    };
  } catch (err) {
    return {
      get: (kunci) => (memori.has(kunci) ? memori.get(kunci) : null),
      set: (kunci, nilai) => memori.set(kunci, String(nilai)),
    };
  }
})();

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const isoHari = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const bln = String(d.getMonth() + 1).padStart(2, '0');
  const tgl = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${bln}-${tgl}`;
};

function seedAwal() {
  const sekarang = new Date().toISOString();
  return {
    seqUser: 2,
    seqTugas: 4,
    users: [
      { id: 1, email: 'demo@example.com', nama: 'Pengguna Demo', password: 'demo1234' },
    ],
    tugas: [
      { id: 3, user_id: 1, judul: 'Coba ubah prioritas dan tenggat tugas ini', selesai: false, prioritas: 'tinggi', tenggat: isoHari(2), dibuat_pada: sekarang, diperbarui_pada: sekarang },
      { id: 2, user_id: 1, judul: 'Coba fitur pencarian di bawah daftar', selesai: false, prioritas: 'sedang', tenggat: isoHari(7), dibuat_pada: sekarang, diperbarui_pada: sekarang },
      { id: 1, user_id: 1, judul: 'Centang tugas ini untuk mencoba toggle optimistis', selesai: true, prioritas: 'rendah', tenggat: null, dibuat_pada: sekarang, diperbarui_pada: sekarang },
    ],
  };
}

function muatDb() {
  try {
    const mentah = penyimpanan.get(DB_KEY);
    if (mentah) return JSON.parse(mentah);
  } catch (err) {
    /* Abaikan data korup dan buat ulang dari seed. */
  }
  const awal = seedAwal();
  penyimpanan.set(DB_KEY, JSON.stringify(awal));
  return awal;
}

function simpanDb(db) {
  penyimpanan.set(DB_KEY, JSON.stringify(db));
}

/** Reset ke seed awal (dipakai automated test). */
export function __resetDemo() {
  const awal = seedAwal();
  penyimpanan.set(DB_KEY, JSON.stringify(awal));
  return awal;
}

/* ------------------------------ Token ------------------------------ */

export function getToken() {
  return penyimpanan.get(TOKEN_KEY);
}

export function setToken(token) {
  if (token) penyimpanan.set(TOKEN_KEY, token);
  else {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (err) {
      memori.delete(TOKEN_KEY);
    }
  }
}

export function logout() {
  setToken(null);
}

const buatToken = (userId) => `demo.${userId}`;

function penggunaDariToken() {
  const token = getToken();
  if (!token || !token.startsWith('demo.')) {
    throw new ApiError('Token autentikasi tidak ditemukan. Silakan masuk kembali.', 401);
  }
  const db = muatDb();
  const user = db.users.find((u) => u.id === Number(token.slice(5)));
  if (!user) {
    throw new ApiError('Akun tidak ditemukan. Silakan masuk kembali.', 401);
  }
  return { db, user };
}

const publik = (user) => ({ id: user.id, email: user.email, nama: user.nama });

/* ------------------------------ Validasi ------------------------------ */

const PRIORITAS_VALID = ['rendah', 'sedang', 'tinggi'];

function validasiJudul(judul) {
  if (judul === undefined || judul === null || typeof judul !== 'string' || judul.trim() === '') {
    throw new ApiError('Judul tugas tidak boleh kosong', 400);
  }
  const bersih = judul.trim();
  if (bersih.length > 200) {
    throw new ApiError('Judul tugas tidak boleh melebihi 200 karakter', 400);
  }
  return bersih;
}

function validasiPrioritas(prioritas) {
  if (prioritas === undefined || prioritas === null || prioritas === '') return 'sedang';
  if (!PRIORITAS_VALID.includes(prioritas)) {
    throw new ApiError('Prioritas harus salah satu dari: rendah, sedang, tinggi', 400);
  }
  return prioritas;
}

function validasiTenggat(tenggat) {
  if (tenggat === undefined || tenggat === null || tenggat === '') return null;
  if (typeof tenggat !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(tenggat)) {
    throw new ApiError('Tenggat harus berupa tanggal valid format YYYY-MM-DD', 400);
  }
  const [thn, bln, tgl] = tenggat.split('-').map(Number);
  const d = new Date(Date.UTC(thn, bln - 1, tgl));
  if (d.getUTCFullYear() !== thn || d.getUTCMonth() !== bln - 1 || d.getUTCDate() !== tgl) {
    throw new ApiError('Tenggat harus berupa tanggal valid format YYYY-MM-DD', 400);
  }
  return tenggat;
}

function validasiId(idParam) {
  if (!idParam || !/^\d+$/.test(String(idParam)) || Number(idParam) <= 0) {
    throw new ApiError('ID tugas harus berupa bilangan bulat positif', 400);
  }
  return Number(idParam);
}

/* ------------------------------ Auth ------------------------------ */

export async function register({ nama, email, password }) {
  await tunda();
  if (typeof nama !== 'string' || nama.trim() === '') {
    throw new ApiError('Nama wajib diisi', 400);
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new ApiError('Alamat email tidak valid', 400);
  }
  if (typeof password !== 'string' || password.length < 8) {
    throw new ApiError('Kata sandi minimal 8 karakter', 400);
  }
  const db = muatDb();
  const emailBersih = email.trim().toLowerCase();
  if (db.users.some((u) => u.email === emailBersih)) {
    throw new ApiError('Email sudah terdaftar. Silakan masuk.', 409);
  }
  const user = { id: db.seqUser++, email: emailBersih, nama: nama.trim(), password };
  db.users.push(user);
  simpanDb(db);
  const token = buatToken(user.id);
  setToken(token);
  return { user: publik(user), token };
}

export async function login({ email, password }) {
  await tunda();
  const db = muatDb();
  const user = db.users.find((u) => u.email === String(email || '').trim().toLowerCase());
  if (!user || user.password !== password) {
    throw new ApiError('Email atau kata sandi salah', 401);
  }
  const token = buatToken(user.id);
  setToken(token);
  return { user: publik(user), token };
}

export async function getMe() {
  await tunda();
  const { user } = penggunaDariToken();
  return { user: publik(user) };
}

/* ------------------------------ Tugas ------------------------------ */

const BOBOT = { tinggi: 0, sedang: 1, rendah: 2 };

export async function getTugas({ status = 'semua', q = '', prioritas = 'semua', sort = 'terbaru', page = 1, limit = 10 } = {}) {
  await tunda();
  const { db, user } = penggunaDariToken();

  if (!['semua', 'aktif', 'selesai'].includes(status)) {
    throw new ApiError('Parameter status harus salah satu dari: semua, aktif, selesai', 400);
  }
  if (prioritas !== 'semua' && !PRIORITAS_VALID.includes(prioritas)) {
    throw new ApiError('Parameter prioritas harus salah satu dari: semua, rendah, sedang, tinggi', 400);
  }
  if (!['terbaru', 'terlama', 'tenggat', 'prioritas'].includes(sort)) {
    throw new ApiError('Parameter sort harus salah satu dari: terbaru, terlama, tenggat, prioritas', 400);
  }
  const halaman = Number(page);
  const batas = Number(limit);
  if (!Number.isInteger(halaman) || halaman < 1) {
    throw new ApiError('Parameter page harus bilangan bulat >= 1', 400);
  }
  if (!Number.isInteger(batas) || batas < 1 || batas > 100) {
    throw new ApiError('Parameter limit harus bilangan bulat 1-100', 400);
  }

  const milik = db.tugas.filter((t) => t.user_id === user.id);
  const kata = String(q || '').trim().toLowerCase();
  const dasar = milik.filter(
    (t) =>
      (prioritas === 'semua' || t.prioritas === prioritas) &&
      (!kata || t.judul.toLowerCase().includes(kata))
  );

  const saring = (daftar, mode) => {
    let hasil = daftar;
    if (mode === 'aktif') hasil = hasil.filter((t) => !t.selesai);
    else if (mode === 'selesai') hasil = hasil.filter((t) => t.selesai);
    hasil = [...hasil];
    if (sort === 'terlama') hasil.sort((a, b) => a.id - b.id);
    else if (sort === 'tenggat') {
      hasil.sort((a, b) => {
        if (!a.tenggat && !b.tenggat) return b.id - a.id;
        if (!a.tenggat) return 1;
        if (!b.tenggat) return -1;
        if (a.tenggat === b.tenggat) return b.id - a.id;
        return a.tenggat < b.tenggat ? -1 : 1;
      });
    } else if (sort === 'prioritas') {
      hasil.sort((a, b) => BOBOT[a.prioritas] - BOBOT[b.prioritas] || b.id - a.id);
    } else hasil.sort((a, b) => b.id - a.id);
    return hasil;
  };

  const tersaring = saring(dasar, status);
  const offset = (halaman - 1) * batas;

  return {
    data: tersaring.slice(offset, offset + batas).map((t) => ({ ...t })),
    pagination: {
      page: halaman,
      limit: batas,
      total: tersaring.length,
      totalHalaman: Math.max(1, Math.ceil(tersaring.length / batas)),
    },
    counts: {
      semua: dasar.length,
      aktif: dasar.filter((t) => !t.selesai).length,
      selesai: dasar.filter((t) => t.selesai).length,
    },
  };
}

export async function getTugasById(id) {
  await tunda();
  const { db, user } = penggunaDariToken();
  const item = db.tugas.find((t) => t.id === validasiId(id) && t.user_id === user.id);
  if (!item) throw new ApiError('Tugas tidak ditemukan', 404);
  return { ...item };
}

export async function createTugas({ judul, prioritas = 'sedang', tenggat = null }) {
  await tunda();
  const { db, user } = penggunaDariToken();
  const tugas = {
    id: db.seqTugas++,
    user_id: user.id,
    judul: validasiJudul(judul),
    selesai: false,
    prioritas: validasiPrioritas(prioritas),
    tenggat: validasiTenggat(tenggat),
    dibuat_pada: new Date().toISOString(),
    diperbarui_pada: new Date().toISOString(),
  };
  db.tugas.push(tugas);
  simpanDb(db);
  return { ...tugas };
}

export async function updateTugas(id, payload = {}) {
  await tunda();
  const { db, user } = penggunaDariToken();
  const { judul, selesai, prioritas, tenggat } = payload;
  if (judul === undefined && selesai === undefined && prioritas === undefined && tenggat === undefined) {
    throw new ApiError('Harus menyertakan setidaknya judul, selesai, prioritas, atau tenggat untuk diperbarui', 400);
  }
  const item = db.tugas.find((t) => t.id === validasiId(id) && t.user_id === user.id);
  if (!item) throw new ApiError('Tugas tidak ditemukan', 404);

  if (judul !== undefined) item.judul = validasiJudul(judul);
  if (selesai !== undefined) {
    if (typeof selesai !== 'boolean') {
      throw new ApiError('Status selesai harus berupa boolean (true atau false)', 400);
    }
    item.selesai = selesai;
  }
  if (prioritas !== undefined) item.prioritas = validasiPrioritas(prioritas ?? 'sedang');
  if (tenggat !== undefined) item.tenggat = validasiTenggat(tenggat);
  item.diperbarui_pada = new Date().toISOString();
  simpanDb(db);
  return { ...item };
}

export async function toggleTugas(id) {
  await tunda();
  const { db, user } = penggunaDariToken();
  const item = db.tugas.find((t) => t.id === validasiId(id) && t.user_id === user.id);
  if (!item) throw new ApiError('Tugas tidak ditemukan', 404);
  item.selesai = !item.selesai;
  item.diperbarui_pada = new Date().toISOString();
  simpanDb(db);
  return { ...item };
}

export async function deleteTugas(id) {
  await tunda();
  const { db, user } = penggunaDariToken();
  const index = db.tugas.findIndex((t) => t.id === validasiId(id) && t.user_id === user.id);
  if (index === -1) throw new ApiError('Tugas tidak ditemukan', 404);
  const [hapus] = db.tugas.splice(index, 1);
  simpanDb(db);
  return { message: 'Tugas berhasil dihapus', id: hapus.id };
}

export async function checkHealth() {
  await tunda(0);
  return { status: 'ok' };
}
