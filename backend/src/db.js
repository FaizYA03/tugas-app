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
let mockData = [
  { id: 1, judul: 'Menyelesaikan persiapan portfolio fullstack', selesai: true, dibuat_pada: new Date().toISOString() },
  { id: 2, judul: 'Mempelajari konsep parameterized query PostgreSQL', selesai: false, dibuat_pada: new Date().toISOString() },
  { id: 3, judul: 'Menguji REST API endpoint dengan smoke test', selesai: false, dibuat_pada: new Date().toISOString() },
];
let nextId = 4;

/**
 * Eksekusi query dengan parameterized query ($1, $2, dst)
 * Menggunakan PostgreSQL Pool jika DATABASE_URL tersedia,
 * atau in-memory fallback yang kompatibel untuk smoke test.
 */
const query = async (text, params = []) => {
  if (pool) {
    return await pool.query(text, params);
  }

  const trimmed = text.trim();

  // SELECT BY ID
  if (trimmed.startsWith('SELECT id, judul, selesai, dibuat_pada FROM tugas WHERE id = $1')) {
    const item = mockData.find((t) => t.id === Number(params[0]));
    return { rows: item ? [{ ...item }] : [] };
  }

  // SELECT ALL (ORDER BY id DESC)
  if (trimmed.startsWith('SELECT id, judul, selesai, dibuat_pada FROM tugas ORDER BY id DESC')) {
    const sorted = [...mockData].sort((a, b) => b.id - a.id);
    return { rows: sorted.map((t) => ({ ...t })) };
  }

  // INSERT
  if (trimmed.startsWith('INSERT INTO tugas (judul) VALUES ($1) RETURNING id, judul, selesai, dibuat_pada')) {
    const newEntry = {
      id: nextId++,
      judul: params[0],
      selesai: false,
      dibuat_pada: new Date().toISOString(),
    };
    mockData.push(newEntry);
    return { rows: [{ ...newEntry }] };
  }

  // UPDATE TOGGLE
  if (trimmed.includes('UPDATE tugas SET selesai = NOT selesai WHERE id = $1')) {
    const item = mockData.find((t) => t.id === Number(params[0]));
    if (item) {
      item.selesai = !item.selesai;
      return { rows: [{ ...item }] };
    }
    return { rows: [] };
  }

  // UPDATE GENERAL
  if (trimmed.startsWith('UPDATE tugas SET')) {
    const id = Number(params[2]);
    const item = mockData.find((t) => t.id === id);
    if (item) {
      if (params[0] !== null && params[0] !== undefined) item.judul = params[0];
      if (params[1] !== null && params[1] !== undefined) item.selesai = params[1];
      return { rows: [{ ...item }] };
    }
    return { rows: [] };
  }

  // DELETE
  if (trimmed.startsWith('DELETE FROM tugas WHERE id = $1 RETURNING id')) {
    const index = mockData.findIndex((t) => t.id === Number(params[0]));
    if (index !== -1) {
      const deleted = mockData.splice(index, 1);
      return { rows: deleted };
    }
    return { rows: [] };
  }

  return { rows: [] };
};

module.exports = {
  pool,
  query,
};
