import React, { useState } from 'react';

/**
 * Komponen item tugas individual
 * Mendukung toggle centang selesai, inline edit judul, dan hapus tugas
 */
export default function ItemTugas({
  tugas,
  onToggle,
  onHapus,
  onEdit,
  isOperating,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [judulEdit, setJudulEdit] = useState(tugas.judul);
  const [editError, setEditError] = useState('');

  const handleMulaiEdit = () => {
    setJudulEdit(tugas.judul);
    setEditError('');
    setIsEditing(true);
  };

  const handleBatalEdit = () => {
    setJudulEdit(tugas.judul);
    setEditError('');
    setIsEditing(false);
  };

  const handleSimpanEdit = async (e) => {
    e.preventDefault();
    const cleanJudul = judulEdit.trim();

    if (!cleanJudul) {
      setEditError('Judul tugas tidak boleh kosong.');
      return;
    }

    if (cleanJudul.length > 200) {
      setEditError('Judul tugas maksimal 200 karakter.');
      return;
    }

    if (cleanJudul === tugas.judul) {
      setIsEditing(false);
      return;
    }

    const success = await onEdit(tugas.id, { judul: cleanJudul });
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <li className={`item-tugas ${tugas.selesai ? 'item-selesai' : ''}`}>
      {isEditing ? (
        <form className="form-edit-inline" onSubmit={handleSimpanEdit}>
          <input
            type="text"
            className="input-edit-inline"
            value={judulEdit}
            onChange={(e) => {
              setJudulEdit(e.target.value);
              if (editError) setEditError('');
            }}
            disabled={isOperating}
            autoFocus
          />
          {editError && <span className="pesan-validasi">{editError}</span>}
          <div className="aksi-edit">
            <button
              type="submit"
              className="btn btn-sm btn-success"
              disabled={isOperating || !judulEdit.trim()}
            >
              Simpan
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={handleBatalEdit}
              disabled={isOperating}
            >
              Batal
            </button>
          </div>
        </form>
      ) : (
        <div className="konten-tugas">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={tugas.selesai}
              onChange={() => onToggle(tugas.id)}
              disabled={isOperating}
              aria-label={`Tandai "${tugas.judul}" selesai`}
            />
            <span className="checkmark"></span>
          </label>

          <span
            className={`judul-tugas ${tugas.selesai ? 'coret' : ''}`}
            onClick={handleMulaiEdit}
            title="Klik dua kali atau tekan tombol edit untuk mengubah"
          >
            {tugas.judul}
          </span>

          <div className="aksi-tugas">
            <button
              type="button"
              className="btn btn-icon btn-edit"
              onClick={handleMulaiEdit}
              disabled={isOperating}
              title="Edit judul"
              aria-label="Edit judul tugas"
            >
              ✏️
            </button>
            <button
              type="button"
              className="btn btn-icon btn-hapus"
              onClick={() => onHapus(tugas.id)}
              disabled={isOperating}
              title="Hapus tugas"
              aria-label="Hapus tugas"
            >
              🗑️
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
