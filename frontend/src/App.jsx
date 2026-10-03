import React, { useState, useEffect, useCallback } from 'react';
import * as api from './services/api';
import FormTugas from './components/FormTugas';
import DaftarTugas from './components/DaftarTugas';

export default function App() {
  const [daftarTugas, setDaftarTugas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operatingId, setOperatingId] = useState(null);
  const [filter, setFilter] = useState('semua'); // 'semua' | 'aktif' | 'selesai'

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
      return true;
    } catch (err) {
      setError(err.message || 'Gagal menambahkan tugas baru.');
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
      setDaftarTugas((prev) =>
        prev.map((t) => (t.id === id ? tugasUpdated : t))
      );
    } catch (err) {
      setError(err.message || 'Gagal mengubah status tugas.');
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
      setDaftarTugas((prev) =>
        prev.map((t) => (t.id === id ? tugasUpdated : t))
      );
      return true;
    } catch (err) {
      setError(err.message || 'Gagal memperbarui judul tugas.');
      return false;
    } finally {
      setOperatingId(null);
    }
  };

  // Handler: Hapus tugas
  const handleHapus = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
      return;
    }
    setOperatingId(id);
    setError(null);
    try {
      await api.deleteTugas(id);
      // Immutably remove item from state
      setDaftarTugas((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message || 'Gagal menghapus tugas.');
    } finally {
      setOperatingId(null);
    }
  };

  // Filter tugas untuk tampilan
  const tugasTerfilter = daftarTugas.filter((tugas) => {
    if (filter === 'aktif') return !tugas.selesai;
    if (filter === 'selesai') return tugas.selesai;
    return true;
  });

  const jumlahTotal = daftarTugas.length;
  const jumlahSelesai = daftarTugas.filter((t) => t.selesai).length;
  const jumlahAktif = jumlahTotal - jumlahSelesai;

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="badge-portfolio">Portfolio Fullstack</div>
        <h1 className="app-title">Daftar Tugas</h1>
        <p className="app-subtitle">
          Aplikasi Manajemen Tugas dengan React, Express REST API, dan PostgreSQL
        </p>
      </header>

      <main className="app-container">
        {/* Banner Pesan Error */}
        {error && (
          <div className="alert-error" role="alert">
            <span className="alert-icon">⚠️</span>
            <div className="alert-body">
              <strong>Terjadi Masalah:</strong>
              <p>{error}</p>
            </div>
            <button
              className="btn btn-sm btn-retry"
              onClick={muatTugas}
              disabled={loading}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Form Tambah Tugas */}
        <section className="card form-card">
          <h2 className="card-title">Tambah Tugas Baru</h2>
          <FormTugas
            onTambahTugas={handleTambahTugas}
            isSubmitting={isSubmitting}
          />
        </section>

        {/* Toolbar & Filter */}
        <section className="card list-card">
          <div className="toolbar">
            <div className="filter-group">
              <button
                className={`filter-btn ${filter === 'semua' ? 'active' : ''}`}
                onClick={() => setFilter('semua')}
              >
                Semua ({jumlahTotal})
              </button>
              <button
                className={`filter-btn ${filter === 'aktif' ? 'active' : ''}`}
                onClick={() => setFilter('aktif')}
              >
                Aktif ({jumlahAktif})
              </button>
              <button
                className={`filter-btn ${filter === 'selesai' ? 'active' : ''}`}
                onClick={() => setFilter('selesai')}
              >
                Selesai ({jumlahSelesai})
              </button>
            </div>

            <button
              className="btn btn-refresh"
              onClick={muatTugas}
              disabled={loading}
              title="Segarkan daftar"
              aria-label="Segarkan daftar tugas"
            >
              🔄 Segarkan
            </button>
          </div>

          {/* Komponen Daftar Tugas */}
          <DaftarTugas
            daftarTugas={tugasTerfilter}
            onToggle={handleToggle}
            onHapus={handleHapus}
            onEdit={handleEdit}
            operatingId={operatingId}
            loading={loading}
          />
        </section>
      </main>

      <footer className="app-footer">
        <p>
          Dibuat dengan ❤️ oleh <strong>Muhammad Faizin</strong> (FaizYA03)
        </p>
        <p className="footer-stack">
          React + Vite • Node.js + Express • PostgreSQL (Parameterized Query)
        </p>
      </footer>
    </div>
  );
}
