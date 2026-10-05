-- Schema Database Aplikasi Daftar Tugas (tugas_db)
-- Instalasi baru: jalankan file ini satu kali.
-- Database lama (sebelum auth/prioritas): jalankan migrations/002_auth_prioritas_tenggat.sql

-- Tabel pengguna untuk autentikasi JWT (satu pengguna = satu daftar tugas)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  dibuat_pada TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tugas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  judul VARCHAR(200) NOT NULL,
  selesai BOOLEAN NOT NULL DEFAULT FALSE,
  prioritas VARCHAR(10) NOT NULL DEFAULT 'sedang'
    CHECK (prioritas IN ('rendah', 'sedang', 'tinggi')),
  tenggat DATE NULL,
  dibuat_pada TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  diperbarui_pada TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk query daftar per pengguna + filter + pencarian
CREATE INDEX IF NOT EXISTS idx_tugas_user ON tugas(user_id);
CREATE INDEX IF NOT EXISTS idx_tugas_user_selesai ON tugas(user_id, selesai);
CREATE INDEX IF NOT EXISTS idx_tugas_user_prioritas ON tugas(user_id, prioritas);
CREATE INDEX IF NOT EXISTS idx_tugas_user_tenggat ON tugas(user_id, tenggat);
CREATE INDEX IF NOT EXISTS idx_tugas_dibuat_pada ON tugas(dibuat_pada DESC);

-- Trigger: perbarui kolom diperbarui_pada setiap ada UPDATE
CREATE OR REPLACE FUNCTION set_diperbarui_pada()
RETURNS TRIGGER AS $$
BEGIN
  NEW.diperbarui_pada = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tugas_diperbarui_pada ON tugas;
CREATE TRIGGER trg_tugas_diperbarui_pada
  BEFORE UPDATE ON tugas
  FOR EACH ROW
  EXECUTE FUNCTION set_diperbarui_pada();

-- Data Contoh (Seed): akun demo demo@example.com / demo1234
INSERT INTO users (email, nama, password_hash) VALUES
  ('demo@example.com', 'Pengguna Demo', '$2b$10$e9Bv1Q44qoezKLWkDYwZWu.H743yK1k88Cl1KcpGoxBJP7nzsQlVK')
ON CONFLICT (email) DO NOTHING;

INSERT INTO tugas (user_id, judul, selesai, prioritas, tenggat)
SELECT id, 'Menyelesaikan persiapan portfolio fullstack', true, 'tinggi', CURRENT_DATE - INTERVAL '2 days'
FROM users WHERE email = 'demo@example.com' AND NOT EXISTS (SELECT 1 FROM tugas)
UNION ALL
SELECT id, 'Mempelajari konsep parameterized query PostgreSQL', false, 'sedang', CURRENT_DATE + INTERVAL '3 days'
FROM users WHERE email = 'demo@example.com' AND NOT EXISTS (SELECT 1 FROM tugas)
UNION ALL
SELECT id, 'Menguji REST API endpoint dengan smoke test', false, 'rendah', NULL
FROM users WHERE email = 'demo@example.com' AND NOT EXISTS (SELECT 1 FROM tugas);
