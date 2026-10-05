const jwt = require('jsonwebtoken');
const db = require('../db');

const getSecret = () => process.env.JWT_SECRET || 'dev-secret-jangan-dipakai-di-produksi';

/**
 * Middleware autentikasi JWT.
 * Memeriksa header `Authorization: Bearer <token>`, memverifikasi token,
 * lalu menempelkan data pengguna ke `req.user`.
 * Menolak dengan 401 bila token hilang, kedaluwarsa, atau tidak valid.
 */
const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [skema, token] = header.split(' ');

    if (skema !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Token autentikasi tidak ditemukan. Silakan masuk kembali.' });
    }

    let payload;
    try {
      payload = jwt.verify(token, getSecret());
    } catch (err) {
      const pesan = err.name === 'TokenExpiredError'
        ? 'Sesi telah kedaluwarsa. Silakan masuk kembali.'
        : 'Token tidak valid. Silakan masuk kembali.';
      return res.status(401).json({ message: pesan });
    }

    const { rows } = await db.query(
      'SELECT id, email, nama, dibuat_pada FROM users WHERE id = $1',
      [payload.sub]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Akun tidak ditemukan. Silakan masuk kembali.' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = auth;
