#!/usr/bin/env bash
# Setup otomatis Codespaces/devcontainer: install dependensi + siapkan .env
set -euo pipefail

DEV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$DEV_DIR/.." && pwd)"

echo "==> Install dependensi backend..."
cd "$ROOT/backend"
npm install --no-audit --no-fund

echo "==> Install dependensi frontend..."
cd "$ROOT/frontend"
npm install --no-audit --no-fund

echo "==> Siapkan file .env (tidak menimpa yang sudah ada)..."
if [ ! -f "$ROOT/backend/.env" ]; then
  cat > "$ROOT/backend/.env" <<'EOF'
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@db:5432/tugas_db
JWT_SECRET=codespaces-dev-secret-minimal-32-karakter-aman
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
EOF
  echo "    backend/.env dibuat (DATABASE_URL -> service db)"
fi

if [ ! -f "$ROOT/frontend/.env" ]; then
  cp "$ROOT/frontend/.env.example" "$ROOT/frontend/.env"
  echo "    frontend/.env dibuat"
fi

echo ""
echo "Setup selesai. Jalankan di dua terminal:"
echo "  Terminal 1: cd backend && npm run dev   (API di :3000)"
echo "  Terminal 2: cd frontend && npm run dev  (UI di :5173, login demo@example.com / demo1234)"
