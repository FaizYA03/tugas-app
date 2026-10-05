import React from 'react';
import './Pagination.css';

/**
 * Navigasi halaman daftar tugas. Disembunyikan bila hanya ada satu halaman.
 */
export default function Pagination({ page, totalHalaman, total, onChange }) {
  if (totalHalaman <= 1) {
    return null;
  }

  return (
    <nav className="pagination" aria-label="Navigasi halaman tugas">
      <button
        type="button"
        className="btn btn--subtle btn--compact pagination__btn"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Ke halaman sebelumnya"
      >
        ‹ Sebelumnya
      </button>

      <p className="pagination__info" aria-live="polite">
        Halaman {page} dari {totalHalaman} • {total} tugas
      </p>

      <button
        type="button"
        className="btn btn--subtle btn--compact pagination__btn"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalHalaman}
        aria-label="Ke halaman berikutnya"
      >
        Berikutnya ›
      </button>
    </nav>
  );
}
