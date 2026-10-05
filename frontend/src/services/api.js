/**
 * Layanan Komunikasi REST API Terpusat
 * Menggunakan base URL dari environment variable VITE_API_URL.
 * Token JWT disimpan di localStorage dan dikirim via header Authorization.
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const TOKEN_KEY = 'daftar-tugas:token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (err) {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    /* Penyimpanan tidak tersedia: sesi hanya berlaku di memori tab ini. */
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

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
    throw new ApiError(errorMsg, response.status);
  }

  return data;
}

/**
 * Helper fetch dengan penanganan error jaringan (misalnya server offline)
 * dan token kedaluwarsa (401 otomatis menghapus token tersimpan).
 */
async function safeFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });
    return await handleResponse(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      setToken(null);
    }
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new ApiError('Tidak dapat terhubung ke server API. Pastikan server backend sedang berjalan.', 0);
    }
    throw error;
  }
}

const json = (body) => ({
  'Content-Type': 'application/json',
});

/* ------------------------------ Auth ------------------------------ */

/**
 * Mendaftarkan akun baru. Mengembalikan { user, token }.
 */
export async function register({ nama, email, password }) {
  const hasil = await safeFetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: json(),
    body: JSON.stringify({ nama, email, password }),
  });
  if (hasil.token) setToken(hasil.token);
  return hasil;
}

/**
 * Masuk dengan email + password. Mengembalikan { user, token }.
 */
export async function login({ email, password }) {
  const hasil = await safeFetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: json(),
    body: JSON.stringify({ email, password }),
  });
  if (hasil.token) setToken(hasil.token);
  return hasil;
}

/**
 * Mengambil profil pengguna dari token aktif.
 */
export async function getMe() {
  return safeFetch(`${BASE_URL}/auth/me`);
}

export function logout() {
  setToken(null);
}

/* ------------------------------ Tugas ------------------------------ */

/**
 * Mengambil daftar tugas milik pengguna login dengan pencarian,
 * filter, sortir, dan pagination (dijalankan di sisi server).
 * Mengembalikan { data, pagination, counts }.
 */
export async function getTugas({ status = 'semua', q = '', prioritas = 'semua', sort = 'terbaru', page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams({
    status,
    sort,
    prioritas,
    page: String(page),
    limit: String(limit),
  });
  if (q) params.set('q', q);
  return safeFetch(`${BASE_URL}/tugas?${params.toString()}`);
}

/**
 * Mengambil tugas tertentu berdasarkan ID
 */
export async function getTugasById(id) {
  return safeFetch(`${BASE_URL}/tugas/${id}`);
}

/**
 * Menambahkan tugas baru: { judul, prioritas?, tenggat? }
 */
export async function createTugas({ judul, prioritas = 'sedang', tenggat = null }) {
  return safeFetch(`${BASE_URL}/tugas`, {
    method: 'POST',
    headers: json(),
    body: JSON.stringify({ judul, prioritas, tenggat }),
  });
}

/**
 * Memperbarui judul / status / prioritas / tenggat tugas
 */
export async function updateTugas(id, payload) {
  return safeFetch(`${BASE_URL}/tugas/${id}`, {
    method: 'PUT',
    headers: json(),
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
  // BASE_URL sudah berakhiran /api sehingga menjadi /api/health
  const response = await fetch(`${BASE_URL}/health`);
  return handleResponse(response);
}
