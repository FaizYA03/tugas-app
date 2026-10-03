import React, { useState } from 'react';
import './FormTugas.css';

const MAKSIMAL = 200;

function Spinner() {
  return (
    <svg
      className="form-tugas__spinner"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.3"
      />
      <path
        d="M21 12a9 9 0 00-9-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Formulir menambahkan tugas baru.
 * Enter submitting, validasi lokal, dan indikator kecil selama request berjalan.
 */
export default function FormTugas({ onTambahTugas, isSubmitting }) {
  const [judul, setJudul] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleChange = (e) => {
    setJudul(e.target.value);
    if (validationError) {
      setValidationError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanJudul = judul.trim();

    if (!cleanJudul) {
      setValidationError('Judul tugas tidak boleh kosong.');
      return;
    }

    if (cleanJudul.length > MAKSIMAL) {
      setValidationError(`Judul tugas maksimal ${MAKSIMAL} karakter.`);
      return;
    }

    setValidationError('');
    const sukses = await onTambahTugas(cleanJudul);

    if (sukses) {
      setJudul('');
    }
  };

  const nearingLimit = judul.length > MAKSIMAL - 20;

  return (
    <form className="form-tugas" onSubmit={handleSubmit} noValidate>
      <label className="u-visually-hidden" htmlFor="input-judul">
        Judul tugas baru
      </label>

      <div className="form-tugas__row">
        <input
          id="input-judul"
          type="text"
          className={`input form-tugas__input ${
            validationError ? 'input--invalid' : ''
          }`}
          placeholder="Apa yang perlu kamu kerjakan?"
          value={judul}
          onChange={handleChange}
          disabled={isSubmitting}
          maxLength={250}
          autoFocus
          aria-invalid={Boolean(validationError)}
          aria-describedby="form-tugas-keterangan"
        />

        <button
          type="submit"
          className="btn btn--primary form-tugas__submit"
          disabled={isSubmitting || !judul.trim()}
        >
          {isSubmitting && <Spinner />}
          <span>{isSubmitting ? 'Menyimpan' : 'Tambah'}</span>
        </button>
      </div>

      <div className="form-tugas__footer" id="form-tugas-keterangan">
        {validationError ? (
          <p className="form-tugas__error" role="alert">
            {validationError}
          </p>
        ) : (
          <span className="form-tugas__hint">Tekan Enter untuk menambahkan</span>
        )}

        <span
          className={`form-tugas__counter ${
            nearingLimit ? 'form-tugas__counter--warn' : ''
          }`}
        >
          {judul.length}/{MAKSIMAL}
        </span>
      </div>
    </form>
  );
}