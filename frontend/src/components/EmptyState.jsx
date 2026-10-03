import React from 'react';
import './EmptyState.css';

const KONTEN = {
  semua: {
    judul: 'Belum ada tugas',
    pesan: 'Mulai dengan menambahkan satu di atas.',
    Ikon: IlonChecklist,
  },
  aktif: {
    judul: 'Semua tugas sudah selesai',
    pesan: 'Tidak ada tugas yang menunggu. Kerja bagus!',
    Ikon: IlonPiala,
  },
  selesai: {
    judul: 'Belum ada tugas selesai',
    pesan: 'Centang tugas yang sudah kamu selesaikan.',
    Ikon: IlonJam,
  },
};

function IlonChecklist() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" focusable="false">
      <rect
        x="11"
        y="8"
        width="26"
        height="32"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M17 19l3 3 4.5-5M17 29h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IlonPiala() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" focusable="false">
      <path
        d="M16 9h16v9a8 8 0 01-16 0V9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 12h-4a5 5 0 005 5M32 12h4a5 5 0 01-5 5M24 26v7M18 39h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IlonJam() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true" focusable="false">
      <circle
        cx="24"
        cy="26"
        r="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M24 19v7l4 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Tampilan saat tidak ada tugas untuk filter aktif.
 * Pesan menyesuaikan filter agar konteksnya jelas.
 */
export default function EmptyState({ filter }) {
  const { judul, pesan, Ikon } = KONTEN[filter] || KONTEN.semua;

  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Ikon />
      </span>
      <p className="empty-state__title">{judul}</p>
      <p className="empty-state__text">{pesan}</p>
    </div>
  );
}