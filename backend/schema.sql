-- Schema Database Aplikasi Daftar Tugas (tugas_db)

CREATE TABLE IF NOT EXISTS tugas (
  id SERIAL PRIMARY KEY,
  judul VARCHAR(200) NOT NULL,
  selesai BOOLEAN NOT NULL DEFAULT FALSE,
  dibuat_pada TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk optimasi query
CREATE INDEX IF NOT EXISTS idx_tugas_selesai ON tugas(selesai);
CREATE INDEX IF NOT EXISTS idx_tugas_dibuat_pada ON tugas(dibuat_pada DESC);

-- Data Contoh (Seed Data)
INSERT INTO tugas (judul, selesai) VALUES
  ('Menyelesaikan persiapan portfolio fullstack', true),
  ('Mempelajari konsep parameterized query PostgreSQL', false),
  ('Menguji REST API endpoint dengan smoke test', false);
