import React from 'react';
import './Toolbar.css';

const OPSI_SORT = [
  { key: 'terbaru', label: 'Terbaru' },
  { key: 'terlama', label: 'Terlama' },
  { key: 'tenggat', label: 'Tenggat' },
  { key: 'prioritas', label: 'Prioritas' },
];

const OPSI_PRIORITAS = [
  { key: 'semua', label: 'Semua prioritas' },
  { key: 'tinggi', label: 'Tinggi' },
  { key: 'sedang', label: 'Sedang' },
  { key: 'rendah', label: 'Rendah' },
];

/**
 * Bilah alat daftar: pencarian (debounce di induk), sortir server-side,
 * dan filter prioritas server-side.
 */
export default function Toolbar({ q, onQ, sort, onSort, prioritas, onPrioritas }) {
  return (
    <div className="toolbar">
      <div className="toolbar__search">
        <label className="u-visually-hidden" htmlFor="input-cari">
          Cari tugas
        </label>
        <svg
          className="toolbar__icon"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          id="input-cari"
          type="search"
          className="input toolbar__input"
          placeholder="Cari tugas…"
          value={q}
          onChange={(e) => onQ(e.target.value)}
          autoComplete="off"
        />
        {q && (
          <button
            type="button"
            className="toolbar__clear"
            onClick={() => onQ('')}
            aria-label="Hapus pencarian"
          >
            ✕
          </button>
        )}
      </div>

      <div className="toolbar__selects">
        <label className="u-visually-hidden" htmlFor="select-prioritas">
          Filter prioritas
        </label>
        <select
          id="select-prioritas"
          className="input toolbar__select"
          value={prioritas}
          onChange={(e) => onPrioritas(e.target.value)}
        >
          {OPSI_PRIORITAS.map((opsi) => (
            <option key={opsi.key} value={opsi.key}>
              {opsi.label}
            </option>
          ))}
        </select>

        <label className="u-visually-hidden" htmlFor="select-sort">
          Urutan tugas
        </label>
        <select
          id="select-sort"
          className="input toolbar__select"
          value={sort}
          onChange={(e) => onSort(e.target.value)}
        >
          {OPSI_SORT.map((opsi) => (
            <option key={opsi.key} value={opsi.key}>
              {opsi.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
