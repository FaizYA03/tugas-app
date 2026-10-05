const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const tugasRouter = require('./routes/tugas');
const authRouter = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;
const isTest = process.env.NODE_ENV === 'test';

// JWT_SECRET wajib di produksi agar token tidak bisa dipalsukan
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET belum diset. Isi JWT_SECRET di environment sebelum menjalankan server.');
    process.exit(1);
  } else {
    console.warn('PERINGATAN: JWT_SECRET belum diset, memakai secret dev (jangan dipakai di produksi).');
  }
}

// Header keamanan HTTP (CSP default dimatikan karena API murni JSON)
app.use(helmet({ contentSecurityPolicy: false }));

// CORS whitelist: hanya origin frontend yang dikenal
const origins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: origins }));

// Batasi ukuran body JSON agar tidak disalahgunakan
app.use(express.json({ limit: '10kb' }));

// Rate limit global: 300 request / 15 menit per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak permintaan. Coba lagi beberapa saat.' },
});
app.use(globalLimiter);

// Rate limit ketat untuk auth (anti brute-force): 20 request / 15 menit per IP.
// Dilonggarkan saat automated test agar tidak flaky.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : Number(process.env.RATE_LIMIT_AUTH_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan masuk. Coba lagi 15 menit.' },
});
app.use('/api/auth', authLimiter);

// Endpoint health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mount router
app.use('/api/auth', authRouter);
app.use('/api/tugas', tugasRouter);

// Penanganan rute 404
app.use((req, res) => {
  res.status(404).json({ message: 'Rute tidak ditemukan' });
});

// Centralized error handler
app.use(errorHandler);

// Jalankan server jika tidak dalam mode pengujian langsung
if (!isTest) {
  app.listen(PORT, () => {
    console.log(`Server Express berjalan pada port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`API Tugas: http://localhost:${PORT}/api/tugas`);
  });
}

module.exports = app;
