import React, { useState } from 'react';

/**
 * Komponen formulir untuk menambahkan tugas baru
 */
export default function FormTugas({ onTambahTugas, isSubmitting }) {
  const [judul, setJudul] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanJudul = judul.trim();

    if (!cleanJudul) {
      setValidationError('Judul tugas tidak boleh kosong.');
      return;
    }

    if (cleanJudul.length > 200) {
      setValidationError('Judul tugas maksimal 200 karakter.');
      return;
    }

    setValidationError('');
    const success = await onTambahTugas(cleanJudul);
    if (success) {
      setJudul('');
    }
  };

  const handleChange = (e) => {
    setJudul(e.target.value);
    if (validationError) {
      setValidationError('');
    }
  };

  return (
    <form className="form-tugas" onSubmit={handleSubmit} noValidate>
      <div className="input-group">
        <input
          type="text"
          className={`input-judul ${validationError ? 'input-error' : ''}`}
          placeholder="Tuliskan tugas baru di sini..."
          value={judul}
          onChange={handleChange}
          disabled={isSubmitting}
          maxLength={250}
          autoFocus
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || !judul.trim()}
        >
          {isSubmitting ? 'Menyimpan...' : 'Tambah Tugas'}
        </button>
      </div>

      {validationError && (
        <p className="pesan-validasi" role="alert">
          {validationError}
        </p>
      )}

      <div className="input-counter">
        <span>{judul.length}/200 karakter</span>
      </div>
    </form>
  );
}
