/**
 * Layanan Komunikasi REST API Terpusat
 * Menggunakan base URL dari environment variable VITE_API_URL
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Helper untuk menangani respon fetch dan parsing error terpusat
 */
async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data && data.message ? data.message : `Permintaan gagal dengan status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Helper fetch dengan penanganan error jaringan (misalnya server offline)
 */
async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return await handleResponse(response);
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Tidak dapat terhubung ke server API. Pastikan server backend sedang berjalan.');
    }
    throw error;
  }
}

/**
 * Mengambil semua daftar tugas
 */
export async function getTugas() {
  return safeFetch(`${BASE_URL}/tugas`);
}

/**
 * Mengambil tugas tertentu berdasarkan ID
 */
export async function getTugasById(id) {
  return safeFetch(`${BASE_URL}/tugas/${id}`);
}

/**
 * Menambahkan tugas baru
 */
export async function createTugas(judul) {
  return safeFetch(`${BASE_URL}/tugas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ judul }),
  });
}

/**
 * Memperbarui judul dan/atau status tugas
 */
export async function updateTugas(id, payload) {
  return safeFetch(`${BASE_URL}/tugas/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Membalikkan (toggle) status selesai tugas
 */
export async function toggleTugas(id) {
  return safeFetch(`${BASE_URL}/tugas/${id}/toggle`, {
    method: 'PATCH',
  });
}

/**
 * Menghapus tugas berdasarkan ID
 */
export async function deleteTugas(id) {
  return safeFetch(`${BASE_URL}/tugas/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Memeriksa status kesehatan server
 */
export async function checkHealth() {
  // BASE_URL adalah http://localhost:3000/api -> replace /api dengan /api/health
  return safeFetch(`${BASE_URL}/health`);
}
