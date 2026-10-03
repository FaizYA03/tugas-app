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
 * Header aplikasi: judul, tanggal hari ini, dan tombol pengalih tema.
 */
export default function Header({ tanggal }) {
  return (
    <header className="header">
      <div className="header__text">
        <p className="header__eyebrow">Portfolio Fullstack</p>
        <h1 className="header__title">Daftar Tugas</h1>
        <p className="header__subtitle">{formatTanggal(tanggal)}</p>
      </div>

      <ThemeToggle />
    </header>
  );
}