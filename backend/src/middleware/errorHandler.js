/**
 * Error Handler terpusat untuk Express API
 * Memastikan semua respon error memiliki format konsisten: { "message": "..." }
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Terjadi kesalahan internal pada server';

  // Catat error jika bukan error validasi klien biasa (status 500)
  if (statusCode >= 500) {
    console.error(`[Server Error ${statusCode}]`, err);
  }

  res.status(statusCode).json({
    message,
  });
};

module.exports = errorHandler;
