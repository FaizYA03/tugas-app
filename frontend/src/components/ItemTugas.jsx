import React, { useEffect, useRef, useState } from 'react';
import { labelTenggat, tenggatKeInput, LABEL_PRIORITAS } from '../utils/tanggal';
import './ItemTugas.css';

const MAKSIMAL = 200;

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false">
      <path
        d="M4 20h4L19 9a2.1 2.1 0 00-3-3L5 17v3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M14.5 6.5 17.5 9.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function IconHapus() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false">
      <path
        d="M4 7h16M9.5 7V5h5v2M6.5 7l1 12h9l1-12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Baris satu tugas: centang selesai, badge prioritas + tenggat,
 * edit inline (judul, prioritas, tenggat), dan hapus dengan
 * konfirmasi ringan (bukan window.confirm).
 */
export default function ItemTugas({
  tugas,
  onToggle,
  onHapus,
  onEdit,
  isOperating,
  isLeaving,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [judulEdit, setJudulEdit] = useState(tugas.judul);
  const [prioritasEdit, setPrioritasEdit] = useState(tugas.prioritas || 'sedang');
  const [tenggatEdit, setTenggatEdit] = useState(() => tenggatKeInput(tugas.tenggat));
  const [editError, setEditError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const editInputRef = useRef(null);

  // Nilai di luar mode edit selalu mengikuti data terbaru dari server.
  useEffect(() => {
    if (!isEditing) {
      setJudulEdit(tugas.judul);
      setPrioritasEdit(tugas.prioritas || 'sedang');
      setTenggatEdit(tenggatKeInput(tugas.tenggat));
    }
  }, [tugas.judul, tugas.prioritas, tugas.tenggat, isEditing]);

  const mulaiEdit = () => {
    setJudulEdit(tugas.judul);
    setPrioritasEdit(tugas.prioritas || 'sedang');
    setTenggatEdit(tenggatKeInput(tugas.tenggat));
    setEditError('');
    setIsEditing(true);
  };

  const batalEdit = () => {
    setJudulEdit(tugas.judul);
    setPrioritasEdit(tugas.prioritas || 'sedang');
    setTenggatEdit(tenggatKeInput(tugas.tenggat));
    setEditError('');
    setIsEditing(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const cleanJudul = judulEdit.trim();

    if (!cleanJudul) {
      setEditError('Judul tugas tidak boleh kosong.');
      return;
    }

    if (cleanJudul.length > MAKSIMAL) {
      setEditError(`Judul tugas maksimal ${MAKSIMAL} karakter.`);
      return;
    }

    const sukses = await onEdit(tugas.id, {
      judul: cleanJudul,
      prioritas: prioritasEdit,
      tenggat: tenggatEdit || null,
    });
    if (sukses) {
      setIsEditing(false);
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      batalEdit();
      editInputRef.current?.blur();
    }
  };

  const konfirmasiHapus = async () => {
    const sukses = await onHapus(tugas.id);
    if (sukses) {
      setIsConfirming(false);
    }
  };

  const kelasItem = [
    'task-item',
    tugas.selesai ? 'task-item--done' : '',
    isLeaving ? 'task-item--leaving' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const infoTenggat = labelTenggat(tugas.tenggat, tugas.selesai);

  if (isEditing) {
    return (
      <li className={`${kelasItem} task-item--editing`}>
        <form className="task-edit" onSubmit={handleEditSubmit}>
          <label className="u-visually-hidden" htmlFor={`edit-${tugas.id}`}>
            Ubah judul tugas
          </label>
          <input
            ref={editInputRef}
            id={`edit-${tugas.id}`}
            type="text"
            className={`input task-edit__input ${editError ? 'input--invalid' : ''}`}
            value={judulEdit}
            onChange={(e) => {
              setJudulEdit(e.target.value);
              if (editError) setEditError('');
            }}
            onKeyDown={handleEditKeyDown}
            disabled={isOperating}
            maxLength={250}
            autoFocus
            aria-invalid={Boolean(editError)}
          />

          <div className="task-edit__meta">
            <div className="task-edit__field">
              <label className="task-edit__label" htmlFor={`edit-prioritas-${tugas.id}`}>
                Prioritas
              </label>
              <select
                id={`edit-prioritas-${tugas.id}`}
                className="input task-edit__select"
                value={prioritasEdit}
                onChange={(e) => setPrioritasEdit(e.target.value)}
                disabled={isOperating}
              >
                <option value="rendah">Rendah</option>
                <option value="sedang">Sedang</option>
                <option value="tinggi">Tinggi</option>
              </select>
            </div>
            <div className="task-edit__field">
              <label className="task-edit__label" htmlFor={`edit-tenggat-${tugas.id}`}>
                Tenggat
              </label>
              <input
                id={`edit-tenggat-${tugas.id}`}
                type="date"
                className="input task-edit__select"
                value={tenggatEdit}
                onChange={(e) => setTenggatEdit(e.target.value)}
                disabled={isOperating}
              />
            </div>
          </div>

          <div className="task-edit__actions">
            {editError && (
              <span className="task-edit__error" role="alert">
                {editError}
              </span>
            )}
            <button
              type="submit"
              className="btn btn--primary btn--compact"
              disabled={isOperating || !judulEdit.trim()}
            >
              Simpan
            </button>
            <button
              type="button"
              className="btn btn--subtle btn--compact"
              onClick={batalEdit}
              disabled={isOperating}
            >
              Batal
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={kelasItem}>
      {isConfirming ? (
        <div className="task-confirm" role="alertdialog" aria-label="Konfirmasi hapus tugas">
          <p className="task-confirm__text">Hapus tugas ini?</p>
          <div className="task-confirm__actions">
            <button
              type="button"
              className="btn btn--danger btn--compact"
              onClick={konfirmasiHapus}
              disabled={isOperating}
              autoFocus
            >
              Ya, hapus
            </button>
            <button
              type="button"
              className="btn btn--subtle btn--compact"
              onClick={() => setIsConfirming(false)}
              disabled={isOperating}
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="task-item__body">
          <label className="task-check">
            <input
              type="checkbox"
              className="task-check__input"
              checked={tugas.selesai}
              onChange={() => onToggle(tugas.id)}
              disabled={isOperating}
              aria-label={`Tandai "${tugas.judul}" selesai`}
            />
            <span className="task-check__box" aria-hidden="true">
              <svg viewBox="0 0 16 16" width="12" height="12" focusable="false">
                <path
                  d="M3 8.5 6.5 12 13 4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </label>

          <div className="task-item__content">
            <span className={`task-item__title ${tugas.selesai ? 'is-done' : ''}`}>
              {tugas.judul}
            </span>

            <span className="task-item__status u-visually-hidden">
              {tugas.selesai ? 'Selesai' : 'Belum selesai'}
            </span>

            <span className="task-item__badges">
              <span
                className={`badge badge--${tugas.prioritas || 'sedang'}`}
                title={`Prioritas ${LABEL_PRIORITAS[tugas.prioritas] || 'Sedang'}`}
              >
                {LABEL_PRIORITAS[tugas.prioritas] || 'Sedang'}
              </span>
              {infoTenggat && (
                <span className={`badge badge--tenggat-${infoTenggat.tone}`}>
                  {infoTenggat.teks}
                </span>
              )}
            </span>
          </div>

          <div className="task-item__actions">
            <button
              type="button"
              className="icon-btn"
              onClick={mulaiEdit}
              disabled={isOperating}
              title="Edit tugas"
              aria-label={`Edit tugas "${tugas.judul}"`}
            >
              <IconEdit />
            </button>
            <button
              type="button"
              className="icon-btn icon-btn--danger"
              onClick={() => setIsConfirming(true)}
              disabled={isOperating}
              title="Hapus tugas"
              aria-label={`Hapus tugas "${tugas.judul}"`}
            >
              <IconHapus />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
