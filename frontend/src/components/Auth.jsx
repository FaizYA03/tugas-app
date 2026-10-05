import React, { useState } from 'react';
import * as api from '../services/api';
import './Auth.css';

const MODE_MASUK = 'masuk';
const MODE_DAFTAR = 'daftar';

/**
 * Layar autentikasi: tab Masuk / Daftar.
 * Token JWT disimpan via api.setToken, profil user diteruskan ke induk.
 */
export default function Auth({ onAuth }) {
  const [mode, setMode] = useState(MODE_MASUK);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gantiMode = (modeBaru) => {
    setMode(modeBaru);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailBersih = email.trim();
    if (!emailBersih || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailBersih)) {
      setError('Masukkan alamat email yang valid.');
      return;
    }
    if (!password) {
      setError('Kata sandi wajib diisi.');
      return;
    }
    if (mode === MODE_DAFTAR) {
      if (!nama.trim()) {
        setError('Nama wajib diisi.');
        return;
      }
      if (password.length < 8) {
        setError('Kata sandi minimal 8 karakter.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const hasil = mode === MODE_MASUK
        ? await api.login({ email: emailBersih, password })
        : await api.register({ nama: nama.trim(), email: emailBersih, password });
      onAuth(hasil.user);
    } catch (err) {
      setError(err.message || 'Gagal menghubungi server. Coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__tabs" role="tablist" aria-label="Pilih masuk atau daftar">
        <button
          type="button"
          role="tab"
          aria-selected={mode === MODE_MASUK}
          className={`auth__tab ${mode === MODE_MASUK ? 'auth__tab--active' : ''}`}
          onClick={() => gantiMode(MODE_MASUK)}
        >
          Masuk
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === MODE_DAFTAR}
          className={`auth__tab ${mode === MODE_DAFTAR ? 'auth__tab--active' : ''}`}
          onClick={() => gantiMode(MODE_DAFTAR)}
        >
          Daftar
        </button>
      </div>

      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        <h2 className="auth__heading">
          {mode === MODE_MASUK ? 'Selamat datang kembali' : 'Buat akun baru'}
        </h2>
        <p className="auth__sub">
          {mode === MODE_MASUK
            ? 'Masuk untuk mengakses daftar tugasmu.'
            : 'Satu akun menyimpan satu daftar tugas pribadi.'}
        </p>

        {mode === MODE_DAFTAR && (
          <div className="auth__field">
            <label className="auth__label" htmlFor="auth-nama">
              Nama
            </label>
            <input
              id="auth-nama"
              type="text"
              className="input"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama lengkap"
              autoComplete="name"
              maxLength={100}
              disabled={isSubmitting}
            />
          </div>
        )}

        <div className="auth__field">
          <label className="auth__label" htmlFor="auth-email">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@example.com"
            autoComplete="email"
            disabled={isSubmitting}
          />
        </div>

        <div className="auth__field">
          <label className="auth__label" htmlFor="auth-password">
            Kata sandi
          </label>
          <input
            id="auth-password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === MODE_DAFTAR ? 'Minimal 8 karakter' : 'Kata sandimu'}
            autoComplete={mode === MODE_MASUK ? 'current-password' : 'new-password'}
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <p className="auth__error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn--primary auth__submit" disabled={isSubmitting}>
          {isSubmitting ? 'Memproses…' : mode === MODE_MASUK ? 'Masuk' : 'Daftar'}
        </button>

        <p className="auth__hint">
          Akun demo: <code>demo@example.com</code> / <code>demo1234</code>
        </p>
      </form>
    </div>
  );
}
