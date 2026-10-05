const db = require('../db');

const PRIORITAS_VALID = ['rendah', 'sedang', 'tinggi'];
const SORT_VALID = ['terbaru', 'terlama', 'tenggat', 'prioritas'];
const STATUS_VALID = ['semua', 'aktif', 'selesai'];
const MAKSIMAL_JUDUL = 200;
const MAKSIMAL_Q = 100;
const LIMIT_DEFAULT = 10;
const LIMIT_MAKSIMAL = 100;

const KOLOM = 'id, judul, selesai, prioritas, tenggat, dibuat_pada, diperbarui_pada';

/**
 * Validasi parameter :id harus berupa bilangan bulat positif (> 0)
 */
const validateId = (idParam) => {
  if (!idParam || !/^\d+$/.test(idParam)) {
    const error = new Error('ID tugas harus berupa bilangan bulat positif');
    error.statusCode = 400;
    throw error;
  }

  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error('ID tugas harus berupa bilangan bulat positif');
    error.statusCode = 400;
    throw error;
  }

  return id;
};

/**
 * Validasi judul: wajib string, trim, tidak kosong, maks 200 karakter.
 * Mengembalikan string bersih atau mengirim 400 langsung.
 */
const validasiJudul = (judul, res) => {
  if (judul === undefined || judul === null || typeof judul !== 'string') {
    res.status(400).json({ message: 'Judul tugas wajib diisi dan berupa string' });
    return null;
  }
  const bersih = judul.trim();
  if (bersih === '') {
    res.status(400).json({ message: 'Judul tugas tidak boleh kosong' });
    return null;
  }
  if (bersih.length > MAKSIMAL_JUDUL) {
    res.status(400).json({ message: `Judul tugas tidak boleh melebihi ${MAKSIMAL_JUDUL} karakter` });
    return null;
  }
  return bersih;
};

/**
 * Validasi prioritas: salah satu dari rendah/sedang/tinggi.
 */
const validasiPrioritas = (prioritas, res) => {
  if (prioritas === undefined || prioritas === null || prioritas === '') {
    return 'sedang';
  }
  if (typeof prioritas !== 'string' || !PRIORITAS_VALID.includes(prioritas)) {
    res.status(400).json({ message: 'Prioritas harus salah satu dari: rendah, sedang, tinggi' });
    return null;
  }
  return prioritas;
};

/**
 * Validasi tenggat: null/kosong (tanpa tenggat) atau tanggal YYYY-MM-DD valid.
 * Mengembalikan string YYYY-MM-DD, null, atau null + respon 400 bila invalid.
 */
const validasiTenggat = (tenggat, res) => {
  if (tenggat === undefined || tenggat === null || tenggat === '') {
    return null;
  }
  if (typeof tenggat !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(tenggat)) {
    res.status(400).json({ message: 'Tenggat harus berupa tanggal valid format YYYY-MM-DD' });
    return undefined;
  }
  const [thn, bln, tgl] = tenggat.split('-').map(Number);
  const d = new Date(Date.UTC(thn, bln - 1, tgl));
  if (d.getUTCFullYear() !== thn || d.getUTCMonth() !== bln - 1 || d.getUTCDate() !== tgl) {
    res.status(400).json({ message: 'Tenggat harus berupa tanggal valid format YYYY-MM-DD' });
    return undefined;
  }
  return tenggat;
};

/**
 * GET /api/tugas
 * Daftar tugas MILIK pengguna login dengan pencarian, filter, sortir,
 * dan pagination (dijalankan di sisi server/database).
 *
 * Query params:
 *   status: semua|aktif|selesai (default semua)
 *   q: kata kunci pencarian judul (maks 100 karakter)
 *   prioritas: semua|rendah|sedang|tinggi (default semua)
 *   sort: terbaru|terlama|tenggat|prioritas (default terbaru)
 *   page: >= 1 (default 1), limit: 1..100 (default 10)
 */
const getAll = async (req, res, next) => {
  try {
    const status = (req.query.status || 'semua').toString().toLowerCase();
    if (!STATUS_VALID.includes(status)) {
      return res.status(400).json({ message: 'Parameter status harus salah satu dari: semua, aktif, selesai' });
    }

    const q = (req.query.q || '').toString().trim().slice(0, MAKSIMAL_Q);

    const prioritas = (req.query.prioritas || 'semua').toString().toLowerCase();
    if (prioritas !== 'semua' && !PRIORITAS_VALID.includes(prioritas)) {
      return res.status(400).json({ message: 'Parameter prioritas harus salah satu dari: semua, rendah, sedang, tinggi' });
    }

    const sort = (req.query.sort || 'terbaru').toString().toLowerCase();
    if (!SORT_VALID.includes(sort)) {
      return res.status(400).json({ message: 'Parameter sort harus salah satu dari: terbaru, terlama, tenggat, prioritas' });
    }

    const page = Number.parseInt((req.query.page || '1').toString(), 10);
    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({ message: 'Parameter page harus bilangan bulat >= 1' });
    }

    const limit = Number.parseInt((req.query.limit || String(LIMIT_DEFAULT)).toString(), 10);
    if (!Number.isInteger(limit) || limit < 1 || limit > LIMIT_MAKSIMAL) {
      return res.status(400).json({ message: `Parameter limit harus bilangan bulat 1-${LIMIT_MAKSIMAL}` });
    }

    const offset = (page - 1) * limit;
    const { rows, total, counts } = await db.listTugas(req.user.id, {
      status, q, prioritas, sort, limit, offset,
    });

    res.status(200).json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalHalaman: Math.max(1, Math.ceil(total / limit)),
      },
      counts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tugas/:id
 * Mengambil satu tugas milik pengguna login berdasarkan ID
 */
const getById = async (req, res, next) => {
  try {
    const id = validateId(req.params.id);
    const { rows } = await db.query(
      `SELECT ${KOLOM} FROM tugas WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/tugas
 * Menambahkan tugas baru milik pengguna login.
 * Body: { judul, prioritas?, tenggat? }
 */
const create = async (req, res, next) => {
  try {
    const judul = validasiJudul(req.body?.judul, res);
    if (judul === null) return;

    const prioritas = validasiPrioritas(req.body?.prioritas, res);
    if (prioritas === null) return;

    const tenggat = validasiTenggat(req.body?.tenggat, res);
    if (tenggat === undefined) return;

    const { rows } = await db.query(
      `INSERT INTO tugas (user_id, judul, prioritas, tenggat) VALUES ($1, $2, $3, $4) RETURNING ${KOLOM}`,
      [req.user.id, judul, prioritas, tenggat]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tugas/:id
 * Memperbarui judul / status / prioritas / tenggat milik pengguna login.
 * Nilai lama digabung dengan nilai baru, lalu disimpan dalam satu UPDATE
 * berbentuk tetap (kontrak dengan mock DB).
 */
const update = async (req, res, next) => {
  try {
    const id = validateId(req.params.id);
    const { judul, selesai, prioritas, tenggat } = req.body || {};

    if (judul === undefined && selesai === undefined && prioritas === undefined && tenggat === undefined) {
      return res.status(400).json({
        message: 'Harus menyertakan setidaknya judul, selesai, prioritas, atau tenggat untuk diperbarui',
      });
    }

    const { rows: lama } = await db.query(
      `SELECT ${KOLOM} FROM tugas WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (lama.length === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    }
    const saatIni = lama[0];

    let judulBaru = saatIni.judul;
    if (judul !== undefined) {
      judulBaru = validasiJudul(judul, res);
      if (judulBaru === null) return;
    }

    let selesaiBaru = saatIni.selesai;
    if (selesai !== undefined) {
      if (typeof selesai !== 'boolean') {
        return res.status(400).json({ message: 'Status selesai harus berupa boolean (true atau false)' });
      }
      selesaiBaru = selesai;
    }

    let prioritasBaru = saatIni.prioritas;
    if (prioritas !== undefined) {
      // String kosong/tegas null pada PUT = kembalikan ke default 'sedang'
      prioritasBaru = validasiPrioritas(prioritas ?? 'sedang', res);
      if (prioritasBaru === null) return;
    }

    let tenggatBaru = saatIni.tenggat ?? null;
    if (tenggat !== undefined) {
      // null eksplisit = hapus tenggat
      tenggatBaru = validasiTenggat(tenggat, res);
      if (tenggatBaru === undefined) return;
    }

    const { rows } = await db.query(
      'UPDATE tugas SET judul = $1, selesai = $2, prioritas = $3, tenggat = $4, diperbarui_pada = CURRENT_TIMESTAMP WHERE id = $5 AND user_id = $6 RETURNING id, judul, selesai, prioritas, tenggat, dibuat_pada, diperbarui_pada',
      [judulBaru, selesaiBaru, prioritasBaru, tenggatBaru, id, req.user.id]
    );

    res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/tugas/:id/toggle
 * Membalikkan (toggle) status selesai tugas milik pengguna login
 */
const toggle = async (req, res, next) => {
  try {
    const id = validateId(req.params.id);
    const { rows } = await db.query(
      'UPDATE tugas SET selesai = NOT selesai, diperbarui_pada = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING id, judul, selesai, prioritas, tenggat, dibuat_pada, diperbarui_pada',
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/tugas/:id
 * Menghapus tugas milik pengguna login berdasarkan ID
 */
const remove = async (req, res, next) => {
  try {
    const id = validateId(req.params.id);
    const { rows } = await db.query(
      'DELETE FROM tugas WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    }

    res.status(200).json({
      message: 'Tugas berhasil dihapus',
      id: rows[0].id,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  toggle,
  remove,
};
