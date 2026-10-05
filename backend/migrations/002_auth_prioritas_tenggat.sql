-- Migrasi 002: Auth + Prioritas + Tenggat
-- Untuk database LAMA yang dibuat oleh schema versi sebelum fitur auth.
-- Aman dijalankan ulang (idempotent).
--
-- Catatan: baris tugas lama tidak punya pemilik, sehingga kolom user_id
-- dibiarkan NULL. Setelah migrasi, tetapkan pemilik secara manual, misal:
--   UPDATE tugas SET user_id = (SELECT id FROM users WHERE email = 'anda@example.com')
--   WHERE user_id IS NULL;
-- atau buat ulang database dari schema.sql untuk instalasi baru.

-- 1. Tabel pengguna
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  dibuat_pada TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Kolom baru di tabel tugas
ALTER TABLE tugas ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE tugas ADD COLUMN IF NOT EXISTS prioritas VARCHAR(10) NOT NULL DEFAULT 'sedang';
ALTER TABLE tugas ADD COLUMN IF NOT EXISTS tenggat DATE NULL;
ALTER TABLE tugas ADD COLUMN IF NOT EXISTS diperbarui_pada TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 3. Batasan nilai prioritas (lewati jika constraint sudah ada)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tugas_prioritas_check'
  ) THEN
    ALTER TABLE tugas ADD CONSTRAINT tugas_prioritas_check
      CHECK (prioritas IN ('rendah', 'sedang', 'tinggi'));
  END IF;
END $$;

-- 4. Index pendukung
CREATE INDEX IF NOT EXISTS idx_tugas_user ON tugas(user_id);
CREATE INDEX IF NOT EXISTS idx_tugas_user_selesai ON tugas(user_id, selesai);
CREATE INDEX IF NOT EXISTS idx_tugas_user_prioritas ON tugas(user_id, prioritas);
CREATE INDEX IF NOT EXISTS idx_tugas_user_tenggat ON tugas(user_id, tenggat);

-- 5. Trigger diperbarui_pada
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
