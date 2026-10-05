import React from 'react';
import './ErrorBanner.css';

function IconPeringatan() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M10 2.5 18.5 17H1.5L10 2.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10 8v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="10" cy="14.6" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * Banner error dengan aksi coba lagi.
 * Memakai role="alert" agar pembaca layar membacakan pesan segera.
 */
export default function ErrorBanner({ pesan, onCobaLagi, isLoading }) {
  if (!pesan) {
    return null;
  }

  return (
    <div className="error-banner" role="alert">
      <span className="error-banner__icon">
        <IconPeringatan />
      </span>

      <div className="error-banner__body">
        <p className="error-banner__title">Terjadi masalah</p>
        <p className="error-banner__text">{pesan}</p>
      </div>

      <button
        type="button"
        className="btn btn--subtle btn--compact error-banner__action"
        onClick={onCobaLagi}
        disabled={isLoading}
      >
        {isLoading ? 'Memuat' : 'Coba lagi'}
      </button>
    </div>
  );
}