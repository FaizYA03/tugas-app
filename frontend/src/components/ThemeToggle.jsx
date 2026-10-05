import React, { useEffect, useState } from 'react';
import './ThemeToggle.css';

const KUNCI_SIMPAN = 'daftar-tugas:tema';

/**
 * Nilai tema harus sama persis dengan nilai yang dipakai selektor CSS
 * (`[data-theme='light']` dan `[data-theme='dark']`).
 */
const TERANG = 'light';
const GELAP = 'dark';

const LABEL = {
  [TERANG]: 'Aktifkan tema gelap',
  [GELAP]: 'Aktifkan tema terang',
};

function IconMatahari() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 2.75v2M12 19.25v2M2.75 12h2M19.25 12h2" />
        <path d="M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M18.6 5.4l-1.4 1.4M6.8 17.2l-1.4 1.4" />
      </g>
    </svg>
  );
}

function IconBulan() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M20.5 14.6A8.5 8.5 0 019.4 3.5a8.5 8.5 0 1011.1 11.1z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Menentukan tema saat komponen pertama kali dimuat.
 * Prioritasnya: tema yang sudah dipasang skrip pre-paint di index.html dari
 * localStorage, baru preferensi sistem. Tanpa ini, efek mount akan menimpa
 * pilihan pengguna yang tersimpan setiap kali halaman dimuat ulang.
 */
function bacaTemaAwal() {
  if (typeof document !== 'undefined') {
    const aktif = document.documentElement.getAttribute('data-theme');
    if (aktif === TERANG || aktif === GELAP) {
      return aktif;
    }
  }

  if (typeof window === 'undefined' || !window.matchMedia) return TERANG;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? GELAP : TERANG;
}

/**
 * Tombol pengalih tema terang/gelap.
 * Pilihan disimpan di localStorage dan dibungkus try/catch agar tetap aman
 * ketika penyimpanan browser dinonaktifkan (mode privat, kebijakan ketat).
 */
export default function ThemeToggle() {
  const [tema, setTema] = useState(bacaTemaAwal);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);

    try {
      window.localStorage.setItem(KUNCI_SIMPAN, tema);
    } catch (error) {
      /* Penyimpanan tidak tersedia: tema hanya berlaku untuk sesi ini. */
    }
  }, [tema]);

  const modeBerikut = tema === TERANG ? GELAP : TERANG;
  const Icon = tema === TERANG ? IconMatahari : IconBulan;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTema(modeBerikut)}
      aria-label={LABEL[modeBerikut]}
      title={LABEL[modeBerikut]}
    >
      <Icon />
    </button>
  );
}