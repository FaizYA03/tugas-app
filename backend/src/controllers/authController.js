const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const SALT_ROUNDS = 10;
const getSecret = () => process.env.JWT_SECRET || 'dev-secret-jangan-dipakai-di-produksi';
const getExpiresIn = () => process.env.JWT_EXPIRES_IN || '7d';

const buatToken = (user) => jwt.sign(
  { sub: user.id, email: user.email },
  getSecret(),
  { expiresIn: getExpiresIn() }
);

const formatUser = (row) => ({
  id: row.id,
  email: row.email,
  nama: row.nama,
  dibuat_pada: row.dibuat_pada,
});

const validasiEmail = (email) => {
  if (typeof email !== 'string') return false;
  const bersih = email.trim().toLowerCase();
  return bersih.length > 0 && bersih.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bersih);
};

/**
 * POST /api/auth/register
 * Mendaftarkan pengguna baru lalu langsung mengembalikan token.
 * Password tidak pernah disimpan mentah (bcrypt hash, cost 10).
 */
const register = async (req, res, next) => {
  try {
    const { nama, email, password } = req.body || {};

    if (typeof nama !== 'string' || nama.trim() === '') {
      return res.status(400).json({ message: 'Nama wajib diisi' });
    }
    if (nama.trim().length > 100) {
      return res.status(400).json({ message: 'Nama tidak boleh melebihi 100 karakter' });
    }
    if (!validasiEmail(email)) {
      return res.status(400).json({ message: 'Alamat email tidak valid' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Kata sandi minimal 8 karakter' });
    }
    if (password.length > 72) {
      // Batas panjang input bcrypt
      return res.status(400).json({ message: 'Kata sandi terlalu panjang (maksimal 72 karakter)' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    let rows;
    try {
      const hasil = await db.query(
        'INSERT INTO users (email, nama, password_hash) VALUES ($1, $2, $3) RETURNING id, email, nama, dibuat_pada',
        [email.trim().toLowerCase(), nama.trim(), passwordHash]
      );
      rows = hasil.rows;
    } catch (err) {
      // 23505 = unique violation (PostgreSQL maupun mock)
      if (err.code === '23505') {
        return res.status(409).json({ message: 'Email sudah terdaftar. Silakan masuk.' });
      }
      throw err;
    }

    const user = formatUser(rows[0]);
    res.status(201).json({ user, token: buatToken(user) });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Verifikasi email + password (timing-safe via bcrypt.compare).
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!validasiEmail(email) || typeof password !== 'string' || password === '') {
      return res.status(400).json({ message: 'Email dan kata sandi wajib diisi' });
    }

    const { rows } = await db.query(
      'SELECT id, email, nama, password_hash, dibuat_pada FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    // Pesan dibuat generik agar tidak membocorkan email mana yang terdaftar
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email atau kata sandi salah' });
    }

    const cocok = await bcrypt.compare(password, rows[0].password_hash);
    if (!cocok) {
      return res.status(401).json({ message: 'Email atau kata sandi salah' });
    }

    const user = formatUser(rows[0]);
    res.status(200).json({ user, token: buatToken(user) });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Mengembalikan profil pengguna dari token aktif.
 */
const me = async (req, res) => {
  res.status(200).json({ user: req.user });
};

module.exports = {
  register,
  login,
  me,
};
