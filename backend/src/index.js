const express = require('express');
const cors = require('cors');
require('dotenv').config();

const tugasRouter = require('./routes/tugas');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(cors());
app.use(express.json());

// Endpoint health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Mount router /api/tugas
app.use('/api/tugas', tugasRouter);

// Penanganan rute 404
app.use((req, res) => {
  res.status(404).json({ message: 'Rute tidak ditemukan' });
});

// Centralized error handler
app.use(errorHandler);

// Jalankan server jika tidak dalam mode pengujian langsung
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server Express berjalan pada port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`API Tugas: http://localhost:${PORT}/api/tugas`);
  });
}

module.exports = app;
