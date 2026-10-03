import React from 'react';
import ItemTugas from './ItemTugas';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';
import './DaftarTugas.css';

/**
 * Wadah daftar tugas: menampilkan skeleton saat memuat, empty state per filter,
 * atau daftar item bila data tersedia.
 */
export default function DaftarTugas({
  daftarTugas,
  filter,
  onToggle,
  onHapus,
  onEdit,
  operatingId,
  leavingIds,
  loading,
  error,
}) {
  if (loading && daftarTugas.length === 0) {
    return <Skeleton />;
  }

  // Saat gagal memuat dan tidak ada data, banner error sudah menjelaskan
  // kondisinya. Empty state akan menyesatkan karena terlihat seperti
  // "tidak ada tugas", bukan "tidak bisa memuat".
  if (error && daftarTugas.length === 0) {
    return null;
  }

  if (daftarTugas.length === 0) {
    return <EmptyState filter={filter} />;
  }

  return (
    <ul className="task-list">
      {daftarTugas.map((tugas) => (
        <ItemTugas
          key={tugas.id}
          tugas={tugas}
          onToggle={onToggle}
          onHapus={onHapus}
          onEdit={onEdit}
          isOperating={operatingId === tugas.id}
          isLeaving={leavingIds.has(tugas.id)}
        />
      ))}
    </ul>
  );
}