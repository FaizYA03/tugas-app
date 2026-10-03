import React from 'react';
import ItemTugas from './ItemTugas';

/**
 * Komponen wadah daftar tugas
 * Bertanggung jawab merender koleksi item tugas dengan key unik berbasis ID
 */
export default function DaftarTugas({
  daftarTugas,
  onToggle,
  onHapus,
  onEdit,
  operatingId,
  loading,
}) {
  if (loading && daftarTugas.length === 0) {
    return (
      <div className="status-container">
        <div className="spinner"></div>
        <p>Memuat daftar tugas...</p>
      </div>
    );
  }

  if (daftarTugas.length === 0) {
    return (
      <div className="status-container kosong">
        <p className="ikon-kosong">🎉</p>
        <p className="teks-kosong">Belum ada tugas yang tersimpan.</p>
        <p className="subteks-kosong">Tuliskan tugas baru di atas untuk mulai produktif!</p>
      </div>
    );
  }

  return (
    <ul className="daftar-tugas">
      {daftarTugas.map((tugas) => (
        <ItemTugas
          key={tugas.id}
          tugas={tugas}
          onToggle={onToggle}
          onHapus={onHapus}
          onEdit={onEdit}
          isOperating={operatingId === tugas.id}
        />
      ))}
    </ul>
  );
}
