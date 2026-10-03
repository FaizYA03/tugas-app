import React from 'react';
import './FilterTabs.css';

const OPSI = [
  { key: 'semua', label: 'Semua' },
  { key: 'aktif', label: 'Belum' },
  { key: 'selesai', label: 'Selesai' },
];

/**
 * Segmented control untuk memfilter tugas, lengkap dengan jumlah per kategori.
 * Menggunakan aria-pressed agar status aktif tersampaikan tanpa mengandalkan warna.
 */
export default function FilterTabs({ filter, onChange, counts }) {
  return (
    <div className="filter-tabs" role="group" aria-label="Filter tugas berdasarkan status">
      {OPSI.map((opsi) => {
        const aktif = opsi.key === filter;

        return (
          <button
            key={opsi.key}
            type="button"
            className={`filter-tabs__tab ${aktif ? 'filter-tabs__tab--active' : ''}`}
            onClick={() => onChange(opsi.key)}
            aria-pressed={aktif}
          >
            <span className="filter-tabs__label">{opsi.label}</span>
            <span className="filter-tabs__count">{counts[opsi.key]}</span>
          </button>
        );
      })}
    </div>
  );
}