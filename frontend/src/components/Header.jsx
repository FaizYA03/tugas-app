import React from 'react';
import ThemeToggle from './ThemeToggle';
import './Header.css';

const HARI = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Format tanggal hari ini dalam Bahasa Indonesia, contoh:
 * "Senin, 4 Oktober 2026"
 */
function formatTanggal(sekarang) {
  return `${HARI[sekarang.getDay()]}, ${sekarang.getDate()} ${
    BULAN[sekarang.getMonth()]
  } ${sekarang.getFullYear()}`;
}

/**
 * Header aplikasi: judul, tanggal hari ini, info pengguna + tombol keluar,
 * dan tombol pengalih tema.
 */
export default function Header({ tanggal, user, onLogout }) {
  return (
    <header className="header">
      <div className="header__text">
        <p className="header__eyebrow">Portfolio Fullstack</p>
        <h1 className="header__title">Daftar Tugas</h1>
        <p className="header__subtitle">{formatTanggal(tanggal)}</p>
      </div>

      <div className="header__side">
        {user && (
          <div className="header__user">
            <span className="header__user-name" title={user.email}>
              {user.nama}
            </span>
            <button
              type="button"
              className="btn btn--subtle btn--compact"
              onClick={onLogout}
            >
              Keluar
            </button>
          </div>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}