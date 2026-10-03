const db = require('../db');

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
 * GET /api/tugas
 * Mengambil seluruh daftar tugas yang diurutkan terbaru dulu (ORDER BY id DESC)
 */
const getAll = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT id, judul, selesai, dibuat_pada FROM tugas ORDER BY id DESC'
    );
    res.status(200).json(rows);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tugas/:id
 * Mengambil satu tugas berdasarkan ID
 */
const getById = async (req, res, next) => {
  try {
    const id = validateId(req.params.id);
    const { rows } = await db.query(
      'SELECT id, judul, selesai, dibuat_pada FROM tugas WHERE id = $1',
      [id]
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
 * Menambahkan tugas baru
 * Validasi: judul wajib string, trim, tidak boleh kosong, max 200 karakter
 */
const create = async (req, res, next) => {
  try {
    const { judul } = req.body;

    if (judul === undefined || judul === null || typeof judul !== 'string') {
      return res.status(400).json({ message: 'Judul tugas wajib diisi dan berupa string' });
    }

    const trimmedJudul = judul.trim();
    if (trimmedJudul === '') {
      return res.status(400).json({ message: 'Judul tugas tidak boleh kosong' });
    }

    if (trimmedJudul.length > 200) {
      return res.status(400).json({ message: 'Judul tugas tidak boleh melebihi 200 karakter' });
    }

    const { rows } = await db.query(
      'INSERT INTO tugas (judul) VALUES ($1) RETURNING id, judul, selesai, dibuat_pada',
      [trimmedJudul]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/tugas/:id
 * Memperbarui judul dan/atau status selesai tugas
 */
const update = async (req, res, next) => {
  try {
    const id = validateId(req.params.id);
    const { judul, selesai } = req.body;

    if (judul === undefined && selesai === undefined) {
      return res.status(400).json({
        message: 'Harus menyertakan setidaknya nilai judul atau status selesai untuk diperbarui',
      });
    }

    let cleanJudul = null;
    if (judul !== undefined) {
      if (typeof judul !== 'string') {
        return res.status(400).json({ message: 'Judul tugas harus berupa string' });
      }
      cleanJudul = judul.trim();
      if (cleanJudul === '') {
        return res.status(400).json({ message: 'Judul tugas tidak boleh kosong' });
      }
      if (cleanJudul.length > 200) {
        return res.status(400).json({ message: 'Judul tugas tidak boleh melebihi 200 karakter' });
      }
    }

    let cleanSelesai = null;
    if (selesai !== undefined) {
      if (typeof selesai !== 'boolean') {
        return res.status(400).json({ message: 'Status selesai harus berupa boolean (true atau false)' });
      }
      cleanSelesai = selesai;
    }

    // Menggunakan COALESCE agar field yang tidak dikirim tidak tertimpa
    const { rows } = await db.query(
      'UPDATE tugas SET judul = COALESCE($1, judul), selesai = COALESCE($2, selesai) WHERE id = $3 RETURNING id, judul, selesai, dibuat_pada',
      [cleanJudul, cleanSelesai, id]
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
 * PATCH /api/tugas/:id/toggle
 * Membalikkan (toggle) status selesai tugas
 */
const toggle = async (req, res, next) => {
  try {
    const id = validateId(req.params.id);
    const { rows } = await db.query(
      'UPDATE tugas SET selesai = NOT selesai WHERE id = $1 RETURNING id, judul, selesai, dibuat_pada',
      [id]
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
 * Menghapus tugas berdasarkan ID
 */
const remove = async (req, res, next) => {
  try {
    const id = validateId(req.params.id);
    const { rows } = await db.query(
      'DELETE FROM tugas WHERE id = $1 RETURNING id',
      [id]
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
