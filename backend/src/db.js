const { Pool } = require('pg');
require('dotenv').config();

// Inisialisasi pool koneksi PostgreSQL dari DATABASE_URL
let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  pool.on('error', (err) => {
    console.error('Koneksi pool PostgreSQL mengalami kendala:', err.message);
  });
}

// In-memory fallback store untuk testing dan demonstrasi ketika database lokal belum disiapkan
let mockUsers = [
  {
    id: 1,
    email: 'demo@example.com',
    nama: 'Pengguna Demo',
    // bcrypt hash dari 'demo1234' (dibuat sekali via bcryptjs)
    password_hash: '$2b$10$e9Bv1Q44qoezKLWkDYwZWu.H743yK1k88Cl1KcpGoxBJP7nzsQlVK',
    dibuat_pada: new Date().toISOString(),
  },
];
let mockNextUserId = 2;

let mockData = [
  { id: 1, user_id: 1, judul: 'Menyelesaikan persiapan portfolio fullstack', selesai: true, prioritas: 'tinggi', tenggat: null, dibuat_pada: new Date().toISOString(), diperbarui_pada: new Date().toISOString() },
  { id: 2, user_id: 1, judul: 'Mempelajari konsep parameterized query PostgreSQL', selesai: false, prioritas: 'sedang', tenggat: null, dibuat_pada: new Date().toISOString(), diperbarui_pada: new Date().toISOString() },
  { id: 3, user_id: 1, judul: 'Menguji REST API endpoint dengan smoke test', selesai: false, prioritas: 'rendah', tenggat: null, dibuat_pada: new Date().toISOString(), diperbarui_pada: new Date().toISOString() },
];
let nextId = 4;

const KOLOM_TUGAS = 'id, judul, selesai, prioritas, tenggat, dibuat_pada, diperbarui_pada';

/**
 * Eksekusi query dengan parameterized query ($1, $2, dst)
 * Menggunakan PostgreSQL Pool jika DATABASE_URL tersedia,
 * atau in-memory fallback yang kompatibel untuk smoke test.
 *
 * Bentuk SQL di bawah adalah kontrak tetap: controller hanya memakai
 * string persis seperti ini sehingga mock dapat menanganinya.
 */
const query = async (text, params = []) => {
  if (pool) {
    return await pool.query(text, params);
  }

  const trimmed = text.trim();

  // USERS: cari berdasarkan email (login)
  if (trimmed.startsWith('SELECT id, email, nama, password_hash, dibuat_pada FROM users WHERE email = $1')) {
    const user = mockUsers.find((u) => u.email === params[0]);
    return { rows: user ? [{ ...user }] : [] };
  }

  // USERS: cari berdasarkan id (middleware auth /me)
  if (trimmed.startsWith('SELECT id, email, nama, dibuat_pada FROM users WHERE id = $1')) {
    const user = mockUsers.find((u) => u.id === Number(params[0]));
    return { rows: user ? [{ id: user.id, email: user.email, nama: user.nama, dibuat_pada: user.dibuat_pada }] : [] };
  }

  // USERS: registrasi
  if (trimmed.startsWith('INSERT INTO users (email, nama, password_hash) VALUES')) {
    if (mockUsers.some((u) => u.email === params[0])) {
      const err = new Error('duplicate key value violates unique constraint "users_email_key"');
      err.code = '23505';
      throw err;
    }
    const user = {
      id: mockNextUserId++,
      email: params[0],
      nama: params[1],
      password_hash: params[2],
      dibuat_pada: new Date().toISOString(),
    };
    mockUsers.push(user);
    return { rows: [{ id: user.id, email: user.email, nama: user.nama, dibuat_pada: user.dibuat_pada }] };
  }

  // TUGAS: SELECT BY ID dalam lingkup pemilik
  if (trimmed.startsWith(`SELECT ${KOLOM_TUGAS} FROM tugas WHERE id = $1 AND user_id = $2`)) {
    const item = mockData.find((t) => t.id === Number(params[0]) && t.user_id === Number(params[1]));
    return { rows: item ? [{ ...item }] : [] };
  }

  // TUGAS: INSERT (milik user login)
  if (trimmed.startsWith('INSERT INTO tugas (user_id, judul, prioritas, tenggat) VALUES')) {
    const newEntry = {
      id: nextId++,
      user_id: Number(params[0]),
      judul: params[1],
      selesai: false,
      prioritas: params[2],
      tenggat: params[3] || null,
      dibuat_pada: new Date().toISOString(),
      diperbarui_pada: new Date().toISOString(),
    };
    mockData.push(newEntry);
    return { rows: [{ ...newEntry }] };
  }

  // TUGAS: UPDATE TOGGLE dalam lingkup pemilik
  if (trimmed.includes('UPDATE tugas SET selesai = NOT selesai, diperbarui_pada = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2')) {
    const item = mockData.find((t) => t.id === Number(params[0]) && t.user_id === Number(params[1]));
    if (item) {
      item.selesai = !item.selesai;
      item.diperbarui_pada = new Date().toISOString();
      return { rows: [{ ...item }] };
    }
    return { rows: [] };
  }

  // TUGAS: UPDATE penuh (judul, selesai, prioritas, tenggat) dalam lingkup pemilik.
  // Controller menggabungkan (merge) nilai lama + baru sebelum memanggil,
  // sehingga mock tidak perlu memahami COALESCE.
  if (trimmed.startsWith('UPDATE tugas SET judul = $1, selesai = $2, prioritas = $3, tenggat = $4, diperbarui_pada = CURRENT_TIMESTAMP WHERE id = $5 AND user_id = $6')) {
    const item = mockData.find((t) => t.id === Number(params[4]) && t.user_id === Number(params[5]));
    if (item) {
      item.judul = params[0];
      item.selesai = params[1];
      item.prioritas = params[2];
      item.tenggat = params[3] || null;
      item.diperbarui_pada = new Date().toISOString();
      return { rows: [{ ...item }] };
    }
    return { rows: [] };
  }

  // TUGAS: DELETE dalam lingkup pemilik
  if (trimmed.startsWith('DELETE FROM tugas WHERE id = $1 AND user_id = $2 RETURNING id')) {
    const index = mockData.findIndex((t) => t.id === Number(params[0]) && t.user_id === Number(params[1]));
    if (index !== -1) {
      const deleted = mockData.splice(index, 1);
      return { rows: [{ id: deleted[0].id }] };
    }
    return { rows: [] };
  }

  return { rows: [] };
};

const BOBOT_PRIORITAS = { tinggi: 0, sedang: 1, rendah: 2 };

/**
 * Penyaringan + pengurutan daftar tugas di memori.
 * Cermin dari logika SQL pada listTugas() agar perilaku mock dan
 * PostgreSQL identik.
 */
function saringDanUrutkan(rows, { status, q, prioritas, sort }) {
  let hasil = rows;

  if (status === 'aktif') hasil = hasil.filter((t) => !t.selesai);
  else if (status === 'selesai') hasil = hasil.filter((t) => t.selesai);

  if (prioritas !== 'semua') hasil = hasil.filter((t) => t.prioritas === prioritas);

  if (q) {
    const kata = q.toLowerCase();
    hasil = hasil.filter((t) => t.judul.toLowerCase().includes(kata));
  }

  hasil = [...hasil];
  if (sort === 'terlama') {
    hasil.sort((a, b) => a.id - b.id);
  } else if (sort === 'tenggat') {
    hasil.sort((a, b) => {
      if (!a.tenggat && !b.tenggat) return b.id - a.id;
      if (!a.tenggat) return 1;
      if (!b.tenggat) return -1;
      if (a.tenggat === b.tenggat) return b.id - a.id;
      return a.tenggat < b.tenggat ? -1 : 1;
    });
  } else if (sort === 'prioritas') {
    hasil.sort((a, b) => {
      const selisih = BOBOT_PRIORITAS[a.prioritas] - BOBOT_PRIORITAS[b.prioritas];
      return selisih !== 0 ? selisih : b.id - a.id;
    });
  } else {
    // 'terbaru' (default): id DESC
    hasil.sort((a, b) => b.id - a.id);
  }

  return hasil;
}

/**
 * Daftar tugas per pengguna dengan filter, pencarian, sortir, dan pagination.
 * Opsi sudah divalidasi controller (whitelist), sehingga aman dirangkai ke SQL.
 *
 * @returns {Promise<{rows: Array, total: number, counts: {semua: number, aktif: number, selesai: number}}>}
 */
const listTugas = async (userId, { status = 'semua', q = '', prioritas = 'semua', sort = 'terbaru', limit = 10, offset = 0 }) => {
  if (pool) {
    const kondisi = ['user_id = $1'];
    const nilai = [userId];
    let nomor = 2;

    // Filter status dipakai untuk data halaman, tapi TIDAK untuk counts
    // (counts dihitung dari filter lain agar tab filter tetap informatif).
    const kondisiData = [...kondisi];
    if (status === 'aktif') kondisiData.push('selesai = false');
    else if (status === 'selesai') kondisiData.push('selesai = true');

    if (prioritas !== 'semua') {
      kondisi.push(`prioritas = $${nomor}`);
      kondisiData.push(`prioritas = $${nomor}`);
      nilai.push(prioritas);
      nomor += 1;
    }

    if (q) {
      kondisi.push(`judul ILIKE $${nomor}`);
      kondisiData.push(`judul ILIKE $${nomor}`);
      nilai.push(`%${q}%`);
      nomor += 1;
    }

    let orderBy = 'id DESC';
    if (sort === 'terlama') orderBy = 'id ASC';
    else if (sort === 'tenggat') orderBy = 'tenggat ASC NULLS LAST, id DESC';
    else if (sort === 'prioritas') {
      orderBy = "CASE prioritas WHEN 'tinggi' THEN 0 WHEN 'sedang' THEN 1 ELSE 2 END, id DESC";
    }

    const whereData = `WHERE ${kondisiData.join(' AND ')}`;
    const whereCounts = `WHERE ${kondisi.join(' AND ')}`;

    const [halaman, agregat, pencacah] = await Promise.all([
      pool.query(
        `SELECT ${KOLOM_TUGAS} FROM tugas ${whereData} ORDER BY ${orderBy} LIMIT $${nomor} OFFSET $${nomor + 1}`,
        [...nilai, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS semua,
                COUNT(*) FILTER (WHERE selesai = false)::int AS aktif,
                COUNT(*) FILTER (WHERE selesai = true)::int AS selesai
         FROM tugas ${whereCounts}`,
        nilai
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM tugas ${whereData}`, nilai),
    ]);

    return {
      rows: halaman.rows,
      total: pencacah.rows[0].total,
      counts: agregat.rows[0],
    };
  }

  // Fallback memori: logika identik via saringDanUrutkan()
  const milikUser = mockData.filter((t) => t.user_id === Number(userId));
  const dasarCounts = saringDanUrutkan(milikUser, { status: 'semua', q, prioritas, sort });
  const halaman = saringDanUrutkan(milikUser, { status, q, prioritas, sort });

  return {
    rows: halaman.slice(offset, offset + limit).map((t) => ({ ...t })),
    total: halaman.length,
    counts: {
      semua: dasarCounts.length,
      aktif: dasarCounts.filter((t) => !t.selesai).length,
      selesai: dasarCounts.filter((t) => t.selesai).length,
    },
  };
};

/**
 * Reset store memori ke kondisi awal (hanya untuk automated test).
 */
const resetMock = () => {
  mockUsers = [
    {
      id: 1,
      email: 'demo@example.com',
      nama: 'Pengguna Demo',
      password_hash: '$2b$10$e9Bv1Q44qoezKLWkDYwZWu.H743yK1k88Cl1KcpGoxBJP7nzsQlVK',
      dibuat_pada: new Date().toISOString(),
    },
  ];
  mockNextUserId = 2;
  mockData = [
    { id: 1, user_id: 1, judul: 'Menyelesaikan persiapan portfolio fullstack', selesai: true, prioritas: 'tinggi', tenggat: null, dibuat_pada: new Date().toISOString(), diperbarui_pada: new Date().toISOString() },
    { id: 2, user_id: 1, judul: 'Mempelajari konsep parameterized query PostgreSQL', selesai: false, prioritas: 'sedang', tenggat: null, dibuat_pada: new Date().toISOString(), diperbarui_pada: new Date().toISOString() },
    { id: 3, user_id: 1, judul: 'Menguji REST API endpoint dengan smoke test', selesai: false, prioritas: 'rendah', tenggat: null, dibuat_pada: new Date().toISOString(), diperbarui_pada: new Date().toISOString() },
  ];
  nextId = 4;
};

module.exports = {
  pool,
  query,
  listTugas,
  resetMock,
  isMock: () => pool === null,
};
