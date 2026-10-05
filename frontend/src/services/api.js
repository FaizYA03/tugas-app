/**
 * Layanan Komunikasi REST API Terpusat
 * Menggunakan base URL dari environment variable VITE_API_URL.
 * Token JWT disimpan di localStorage dan dikirim via header Authorization.
 *
 * MODE DEMO: bila dibuild dengan VITE_DEMO_MODE=true (untuk GitHub Pages),
 * seluruh fungsi didelegasikan ke services/demo.js — simulasi API di browser
 * dengan kontrak respons yang identik, sehingga komponen tidak perlu berubah.
 */
import * as demo from './demo';

export const MODE_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

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
export async function register(payload) {
  if (MODE_DEMO) return demo.register(payload);
  const hasil = await safeFetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: json(),
    body: JSON.stringify(payload),
  });
  if (hasil.token) setToken(hasil.token);
  return hasil;
}

/**
 * Masuk dengan email + password. Mengembalikan { user, token }.
 */
export async function login(payload) {
  if (MODE_DEMO) return demo.login(payload);
  const hasil = await safeFetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: json(),
    body: JSON.stringify(payload),
  });
  if (hasil.token) setToken(hasil.token);
  return hasil;
}

/**
 * Mengambil profil pengguna dari token aktif.
 */
export async function getMe() {
  if (MODE_DEMO) return demo.getMe();
  return safeFetch(`${BASE_URL}/auth/me`);
}

export function logout() {
  if (MODE_DEMO) demo.logout();
  setToken(null);
}

/* ------------------------------ Tugas ------------------------------ */

/**
 * Mengambil daftar tugas milik pengguna login dengan pencarian,
 * filter, sortir, dan pagination (dijalankan di sisi server).
 * Mengembalikan { data, pagination, counts }.
 */
export async function getTugas({ status = 'semua', q = '', prioritas = 'semua', sort = 'terbaru', page = 1, limit = 10 } = {}) {
  if (MODE_DEMO) return demo.getTugas({ status, q, prioritas, sort, page, limit });
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
  if (MODE_DEMO) return demo.getTugasById(id);
  return safeFetch(`${BASE_URL}/tugas/${id}`);
}

/**
 * Menambahkan tugas baru: { judul, prioritas?, tenggat? }
 */
export async function createTugas(payload) {
  if (MODE_DEMO) return demo.createTugas(payload);
  return safeFetch(`${BASE_URL}/tugas`, {
    method: 'POST',
    headers: json(),
    body: JSON.stringify(payload),
  });
}

/**
 * Memperbarui judul / status / prioritas / tenggat tugas
 */
export async function updateTugas(id, payload) {
  if (MODE_DEMO) return demo.updateTugas(id, payload);
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
  if (MODE_DEMO) return demo.toggleTugas(id);
  return safeFetch(`${BASE_URL}/tugas/${id}/toggle`, {
    method: 'PATCH',
  });
}

/**
 * Menghapus tugas berdasarkan ID
 */
export async function deleteTugas(id) {
  if (MODE_DEMO) return demo.deleteTugas(id);
  return safeFetch(`${BASE_URL}/tugas/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Memeriksa status kesehatan server
 */
export async function checkHealth() {
  if (MODE_DEMO) return demo.checkHealth();
  // BASE_URL sudah berakhiran /api sehingga menjadi /api/health
  const response = await fetch(`${BASE_URL}/health`);
  return handleResponse(response);
}
