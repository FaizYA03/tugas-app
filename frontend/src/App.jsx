import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from './services/api';
import Header from './components/Header';
import ProgressBar from './components/ProgressBar';
import ErrorBanner from './components/ErrorBanner';
import FormTugas from './components/FormTugas';
import FilterTabs from './components/FilterTabs';
import Toolbar from './components/Toolbar';
import DaftarTugas from './components/DaftarTugas';
import Pagination from './components/Pagination';
import Toast from './components/Toast';
import Auth from './components/Auth';

const DURASI_TOAST = 2800;
const DURASI_KELUAR = 180;
const LIMIT_HALAMAN = 10;
const TUNDA_CARI = 350;

export default function App() {
  const [token, setTokenState] = useState(() => api.getToken());
  const [user, setUser] = useState(null);

  const [daftarTugas, setDaftarTugas] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: LIMIT_HALAMAN, total: 0, totalHalaman: 1 });
  const [counts, setCounts] = useState({ semua: 0, aktif: 0, selesai: 0 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operatingId, setOperatingId] = useState(null);

  const [filter, setFilter] = useState('semua');
  const [masukanCari, setMasukanCari] = useState('');
  const [kataKunci, setKataKunci] = useState('');
  const [sort, setSort] = useState('terbaru');
  const [filterPrioritas, setFilterPrioritas] = useState('semua');
  const [halaman, setHalaman] = useState(1);

  const [notifikasi, setNotifikasi] = useState(null);
  const [leavingIds, setLeavingIds] = useState(() => new Set());

  const toastTimerRef = useRef(null);
  const leaveTimerRef = useRef(null);
  const cariTimerRef = useRef(null);

  // Tanggal diambil sekali saat render pertama agar header tidak ikut berubah
  // setiap kali state berubah.
  const [tanggal] = useState(() => new Date());

  useEffect(
    () => () => {
      window.clearTimeout(toastTimerRef.current);
      window.clearTimeout(leaveTimerRef.current);
      window.clearTimeout(cariTimerRef.current);
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

  const handleLogout = useCallback((pesan) => {
    api.logout();
    setTokenState(null);
    setUser(null);
    setDaftarTugas([]);
    setCounts({ semua: 0, aktif: 0, selesai: 0 });
    setPagination({ page: 1, limit: LIMIT_HALAMAN, total: 0, totalHalaman: 1 });
    setError(null);
    if (pesan) tampilkanToast(pesan, 'gagal');
  }, [tampilkanToast]);

  // Token 401 (kedaluwarsa/invalid) di mana pun -> paksa keluar.
  const tanganiApiError = useCallback((err, pesanDefault) => {
    if (err && err.status === 401) {
      handleLogout('Sesi telah berakhir. Silakan masuk kembali.');
      return;
    }
    const pesan = (err && err.message) || pesanDefault;
    setError(pesan);
    tampilkanToast(pesan, 'gagal');
  }, [handleLogout, tampilkanToast]);

  // Verifikasi token tersimpan saat aplikasi dibuka
  useEffect(() => {
    if (!token) return;
    let batal = false;
    api.getMe()
      .then((hasil) => {
        if (!batal) setUser(hasil.user);
      })
      .catch(() => {
        if (!batal) handleLogout();
      });
    return () => {
      batal = true;
    };
  }, [token, handleLogout]);

  // Debounce input pencarian agar tidak membanjiri server
  useEffect(() => {
    window.clearTimeout(cariTimerRef.current);
    cariTimerRef.current = window.setTimeout(() => {
      setKataKunci(masukanCari.trim());
      setHalaman(1);
    }, TUNDA_CARI);
  }, [masukanCari]);

  // Mengambil daftar tugas dari backend (filter/search/sort/page server-side)
  const muatTugas = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const hasil = await api.getTugas({
        status: filter,
        q: kataKunci,
        prioritas: filterPrioritas,
        sort,
        page: halaman,
        limit: LIMIT_HALAMAN,
      });
      setDaftarTugas(hasil.data);
      setPagination(hasil.pagination);
      setCounts(hasil.counts);
    } catch (err) {
      if (err && err.status === 401) {
        handleLogout('Sesi telah berakhir. Silakan masuk kembali.');
        return;
      }
      setError(err.message || 'Gagal memuat daftar tugas dari server.');
    } finally {
      setLoading(false);
    }
  }, [token, filter, kataKunci, filterPrioritas, sort, halaman, handleLogout]);

  useEffect(() => {
    muatTugas();
  }, [muatTugas]);

  const handleAuth = useCallback((pengguna) => {
    setTokenState(api.getToken());
    setUser(pengguna);
    setFilter('semua');
    setMasukanCari('');
    setKataKunci('');
    setSort('terbaru');
    setFilterPrioritas('semua');
    setHalaman(1);
  }, []);

  const gantiFilter = (nilai) => {
    setFilter(nilai);
    setHalaman(1);
  };

  const gantiSort = (nilai) => {
    setSort(nilai);
    setHalaman(1);
  };

  const gantiPrioritas = (nilai) => {
    setFilterPrioritas(nilai);
    setHalaman(1);
  };

  // Handler: Tambah tugas baru, lalu sinkron ulang dari server agar
  // pagination/sort/filter tetap konsisten.
  const handleTambahTugas = async (payload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.createTugas(payload);
      tampilkanToast('Tugas ditambahkan.');
      if (halaman !== 1) {
        setHalaman(1);
      } else {
        await muatTugas();
      }
      return true;
    } catch (err) {
      tanganiApiError(err, 'Gagal menambahkan tugas baru.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Toggle optimistis — UI dibalik seketika, dikembalikan bila gagal.
  const handleToggle = async (id) => {
    const target = daftarTugas.find((t) => t.id === id);
    if (!target || operatingId === id) return;

    setOperatingId(id);
    setError(null);
    setDaftarTugas((prev) => prev.map((t) => (t.id === id ? { ...t, selesai: !t.selesai } : t)));

    try {
      const tugasUpdated = await api.toggleTugas(id);
      setDaftarTugas((prev) => prev.map((t) => (t.id === id ? tugasUpdated : t)));
      setCounts((prev) => {
        const delta = tugasUpdated.selesai ? -1 : 1;
        return { semua: prev.semua, aktif: prev.aktif + delta, selesai: prev.selesai - delta };
      });
    } catch (err) {
      // Rollback ke nilai sebelum dibalik
      setDaftarTugas((prev) => prev.map((t) => (t.id === id ? target : t)));
      tanganiApiError(err, 'Gagal mengubah status tugas.');
    } finally {
      setOperatingId((saatIni) => (saatIni === id ? null : saatIni));
    }
  };

  // Handler: Edit tugas lalu sinkron ulang halaman aktif (urutan bisa berubah
  // bila sort memakai prioritas/tenggat).
  const handleEdit = async (id, payload) => {
    setOperatingId(id);
    setError(null);
    try {
      await api.updateTugas(id, payload);
      await muatTugas();
      tampilkanToast('Tugas diperbarui.');
      return true;
    } catch (err) {
      tanganiApiError(err, 'Gagal memperbarui tugas.');
      return false;
    } finally {
      setOperatingId(null);
    }
  };

  // Handler: Hapus tugas. Item ditandai keluar lebih dulu supaya animasi
  // selesai, baru halaman disinkronkan dari server.
  const handleHapus = async (id) => {
    setOperatingId(id);
    setError(null);
    try {
      await api.deleteTugas(id);

      setLeavingIds((prev) => new Set(prev).add(id));
      leaveTimerRef.current = window.setTimeout(() => {
        setLeavingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        // Mundur satu halaman bila halaman aktif jadi kosong
        if (daftarTugas.length <= 1 && halaman > 1) {
          setHalaman(halaman - 1);
        } else {
          muatTugas();
        }
      }, DURASI_KELUAR);

      tampilkanToast('Tugas dihapus.');
      return true;
    } catch (err) {
      tanganiApiError(err, 'Gagal menghapus tugas.');
      return false;
    } finally {
      setOperatingId(null);
    }
  };

  const jumlahPerFilter = useMemo(() => ({
    semua: counts.semua,
    aktif: counts.aktif,
    selesai: counts.selesai,
  }), [counts]);

  const jumlahSelesai = counts.selesai;
  const jumlahTotal = counts.semua;

  return (
    <div className="app">
      <div className="app__card">
        <Header tanggal={tanggal} user={user} onLogout={() => handleLogout()} />

        {!token || !user ? (
          <Auth onAuth={handleAuth} />
        ) : (
          <>
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
                onChange={gantiFilter}
                counts={jumlahPerFilter}
              />

              <Toolbar
                q={masukanCari}
                onQ={setMasukanCari}
                sort={sort}
                onSort={gantiSort}
                prioritas={filterPrioritas}
                onPrioritas={gantiPrioritas}
              />

              <div className="app__list">
                <DaftarTugas
                  daftarTugas={daftarTugas}
                  filter={filter}
                  pencarian={kataKunci}
                  onToggle={handleToggle}
                  onHapus={handleHapus}
                  onEdit={handleEdit}
                  operatingId={operatingId}
                  leavingIds={leavingIds}
                  loading={loading}
                  error={error}
                />
              </div>

              <Pagination
                page={pagination.page}
                totalHalaman={pagination.totalHalaman}
                total={pagination.total}
                onChange={setHalaman}
              />
            </section>
          </>
        )}
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
