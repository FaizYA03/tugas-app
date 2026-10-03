import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from './services/api';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import ErrorBanner from './components/ErrorBanner';
import FormTugas from './components/FormTugas';
import FilterTabs from './components/FilterTabs';
import DaftarTugas from './components/DaftarTugas';
import Toast from './components/Toast';

const DURASI_TOAST = 2800;
const DURASI_KELUAR = 180;

export default function App() {
  const [daftarTugas, setDaftarTugas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operatingId, setOperatingId] = useState(null);
  const [filter, setFilter] = useState('semua');
  const [notifikasi, setNotifikasi] = useState(null);
  const [leavingIds, setLeavingIds] = useState(() => new Set());

  const toastTimerRef = useRef(null);
  const leaveTimerRef = useRef(null);

  // Tanggal diambil sekali saat render pertama agar header tidak ikut berubah
  // setiap kali state berubah.
  const [tanggal] = useState(() => new Date());

  useEffect(
    () => () => {
      window.clearTimeout(toastTimerRef.current);
      window.clearTimeout(leaveTimerRef.current);
    },
    []
  );

  const tampilkanToast = useCallback((pesan, tipe = 'sukses') => {
    window.clearTimeout(toastTimerRef.current);
    setNotifikasi({ id: Date.now(), pesan, tipe });

    toastTimerRef.current = window.setTimeout(() => {
      setNotifikasi(null);
    }, DURASI_TOAST);
  }, []);

  // Mengambil daftar tugas dari backend
  const muatTugas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTugas();
      setDaftarTugas(data);
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar tugas dari server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    muatTugas();
  }, [muatTugas]);

  // Handler: Tambah tugas baru
  const handleTambahTugas = async (judul) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const tugasBaru = await api.createTugas(judul);
      // Immutably prepend tugas baru di awal list (urut terbaru dulu)
      setDaftarTugas((prev) => [tugasBaru, ...prev]);
      tampilkanToast('Tugas ditambahkan.');
      return true;
    } catch (err) {
      const pesan = err.message || 'Gagal menambahkan tugas baru.';
      setError(pesan);
      tampilkanToast(pesan, 'gagal');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Toggle status selesai
  const handleToggle = async (id) => {
    setOperatingId(id);
    setError(null);
    try {
      const tugasUpdated = await api.toggleTugas(id);
      // Immutably update state
      setDaftarTugas((prev) => prev.map((t) => (t.id === id ? tugasUpdated : t)));
    } catch (err) {
      const pesan = err.message || 'Gagal mengubah status tugas.';
      setError(pesan);
      tampilkanToast(pesan, 'gagal');
    } finally {
      setOperatingId(null);
    }
  };

  // Handler: Edit judul tugas inline
  const handleEdit = async (id, payload) => {
    setOperatingId(id);
    setError(null);
    try {
      const tugasUpdated = await api.updateTugas(id, payload);
      // Immutably update state
      setDaftarTugas((prev) => prev.map((t) => (t.id === id ? tugasUpdated : t)));
      tampilkanToast('Tugas diperbarui.');
      return true;
    } catch (err) {
      const pesan = err.message || 'Gagal memperbarui judul tugas.';
      setError(pesan);
      tampilkanToast(pesan, 'gagal');
      return false;
    } finally {
      setOperatingId(null);
    }
  };

  // Handler: Hapus tugas. Item ditandai keluar lebih dulu supaya animasi
  // selesai baru dilepas dari state.
  const handleHapus = async (id) => {
    setOperatingId(id);
    setError(null);
    try {
      await api.deleteTugas(id);

      setLeavingIds((prev) => new Set(prev).add(id));
      leaveTimerRef.current = window.setTimeout(() => {
        setDaftarTugas((prev) => prev.filter((t) => t.id !== id));
        setLeavingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, DURASI_KELUAR);

      tampilkanToast('Tugas dihapus.');
      return true;
    } catch (err) {
      const pesan = err.message || 'Gagal menghapus tugas.';
      setError(pesan);
      tampilkanToast(pesan, 'gagal');
      return false;
    } finally {
      setOperatingId(null);
    }
  };

  const tugasTerfilter = useMemo(
    () =>
      daftarTugas.filter((tugas) => {
        if (filter === 'aktif') return !tugas.selesai;
        if (filter === 'selesai') return tugas.selesai;
        return true;
      }),
    [daftarTugas, filter]
  );

  const jumlahTotal = daftarTugas.length;
  const jumlahSelesai = daftarTugas.filter((t) => t.selesai).length;
  const jumlahAktif = jumlahTotal - jumlahSelesai;

  const jumlahPerFilter = {
    semua: jumlahTotal,
    aktif: jumlahAktif,
    selesai: jumlahSelesai,
  };

  return (
    <div className="app">
      <div className="app__card">
        <Header tanggal={tanggal} />

        <ProgressBar total={jumlahTotal} selesai={jumlahSelesai} />

        <ErrorBanner
          pesan={error}
          onCobaLagi={muatTugas}
          isLoading={loading}
        />

        <section className="app__section" aria-labelledby="judul-tambah">
          <h2 className="app__section-heading" id="judul-tambah">
            Tugas Baru
          </h2>
          <FormTugas onTambahTugas={handleTambahTugas} isSubmitting={isSubmitting} />
        </section>

        <section className="app__section" aria-labelledby="judul-daftar">
          <h2 className="app__section-heading" id="judul-daftar">
            Daftar Tugas
          </h2>

          <FilterTabs
            filter={filter}
            onChange={setFilter}
            counts={jumlahPerFilter}
          />

          <div className="app__list">
            <DaftarTugas
              daftarTugas={tugasTerfilter}
              filter={filter}
              onToggle={handleToggle}
              onHapus={handleHapus}
              onEdit={handleEdit}
              operatingId={operatingId}
              leavingIds={leavingIds}
              loading={loading}
              error={error}
            />
          </div>
        </section>
      </div>

      <footer className="app__footer">
        <p>
          Dibuat oleh <strong>Muhammad Faizin</strong> (@FaizYA03)
        </p>
        <p className="app__footer-stack">
          React + Vite &middot; Express REST API &middot; PostgreSQL
        </p>
      </footer>

      <Toast notifikasi={notifikasi} />
    </div>
  );
}