import React from 'react';
import './Toast.css';

function IconCek() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" focusable="false">
      <path
        d="M3 8.5 6.5 12 13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSilang() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" focusable="false">
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Notifikasi singkat untuk aksi berhasil atau gagal.
 * Ditaruh di area aria-live supaya dibaca tanpa memindahkan fokus.
 */
export default function Toast({ notifikasi }) {
  return (
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
      {notifikasi && (
        <div className={`toast toast--${notifikasi.tipe}`} key={notifikasi.id}>
          <span className="toast__icon">
            {notifikasi.tipe === 'sukses' ? <IconCek /> : <IconSilang />}
          </span>
          <span className="toast__text">{notifikasi.pesan}</span>
        </div>
      )}
    </div>
  );
}