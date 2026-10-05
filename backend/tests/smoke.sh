#!/usr/bin/env bash

# Smoke Test REST API Daftar Tugas (dengan auth JWT)
# Menguji seluruh endpoint API dengan curl termasuk kasus error

BASE_URL="${BASE_URL:-http://localhost:3000}"
FAILED=0
TOTAL=0
EMAIL="smoke-$(date +%s)@example.com"

assert_status() {
  local test_name="$1"
  local expected_status="$2"
  local actual_status="$3"
  local body="$4"

  TOTAL=$((TOTAL + 1))
  if [ "$actual_status" -eq "$expected_status" ]; then
    echo "[PASS] $test_name (Status: $actual_status)"
  else
    echo "[FAIL] $test_name (Diharapkan: $expected_status, Didapat: $actual_status)"
    echo "       Respon: $body"
    FAILED=$((FAILED + 1))
  fi
}

echo "=============================================="
echo "  Memulai Smoke Test API di $BASE_URL"
echo "=============================================="

# 1. Health check
res=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "GET /api/health" 200 "$status" "$body"

# 2. Tanpa token -> 401
res=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/tugas")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "GET /api/tugas tanpa token (error 401)" 401 "$status" "$body"

# 3. Register akun smoke test
res=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"nama\":\"Smoke\",\"email\":\"$EMAIL\",\"password\":\"rahasia123\"}")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "POST /api/auth/register (sukses 201)" 201 "$status" "$body"

# Ambil token JWT dari respon
TOKEN=$(echo "$body" | grep -o '"token":"[^"]*"' | head -n1 | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo "Gagal mendapatkan token, hentikan pengujian."
  exit 1
fi
AUTH_HEADER="Authorization: Bearer $TOKEN"

# 4. Get all tugas (format pagination)
res=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/tugas" -H "$AUTH_HEADER")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "GET /api/tugas" 200 "$status" "$body"

# 5. Create tugas (Valid + prioritas + tenggat)
res=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/tugas" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{"judul":"Tugas dari smoke test","prioritas":"tinggi","tenggat":"2026-12-31"}')
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "POST /api/tugas (sukses 201)" 201 "$status" "$body"

# Ambil ID tugas yang baru dibuat
TUGAS_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -n1 | cut -d':' -f2)
if [ -z "$TUGAS_ID" ]; then
  TUGAS_ID=1
fi

# 6. Create tugas - Judul kosong (Error 400)
res=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/tugas" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{"judul":"   "}')
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "POST /api/tugas judul kosong (error 400)" 400 "$status" "$body"

# 7. Create tugas - Judul > 200 karakter (Error 400)
LONG_TITLE=$(printf 'A%.0s' {1..205})
res=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/tugas" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d "{\"judul\":\"$LONG_TITLE\"}")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "POST /api/tugas judul > 200 karakter (error 400)" 400 "$status" "$body"

# 8. Get tugas by ID
res=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/tugas/$TUGAS_ID" -H "$AUTH_HEADER")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "GET /api/tugas/:id (sukses 200)" 200 "$status" "$body"

# 9. Get tugas by ID - Not Found (404)
res=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/tugas/999999" -H "$AUTH_HEADER")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "GET /api/tugas/:id tidak ditemukan (error 404)" 404 "$status" "$body"

# 10. Get tugas by ID - ID tidak valid (400)
res=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/tugas/invalid-id" -H "$AUTH_HEADER")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "GET /api/tugas/:id non-integer (error 400)" 400 "$status" "$body"

# 11. Update tugas PUT /api/tugas/:id
res=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/tugas/$TUGAS_ID" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{"judul":"Tugas telah diperbarui","selesai":true}')
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "PUT /api/tugas/:id (sukses 200)" 200 "$status" "$body"

# 12. Update tugas - payload kosong (400)
res=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/tugas/$TUGAS_ID" \
  -H "$AUTH_HEADER" \
  -H "Content-Type: application/json" \
  -d '{}')
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "PUT /api/tugas/:id tanpa body (error 400)" 400 "$status" "$body"

# 13. Search + pagination
res=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/tugas?q=diperbarui&limit=5&page=1" -H "$AUTH_HEADER")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "GET /api/tugas?q (sukses 200)" 200 "$status" "$body"

# 14. Toggle tugas PATCH /api/tugas/:id/toggle
res=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/api/tugas/$TUGAS_ID/toggle" -H "$AUTH_HEADER")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "PATCH /api/tugas/:id/toggle (sukses 200)" 200 "$status" "$body"

# 15. Delete tugas DELETE /api/tugas/:id
res=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/tugas/$TUGAS_ID" -H "$AUTH_HEADER")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "DELETE /api/tugas/:id (sukses 200)" 200 "$status" "$body"

# 16. Delete tugas yang sudah dihapus (404)
res=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/tugas/$TUGAS_ID" -H "$AUTH_HEADER")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "DELETE /api/tugas/:id sudah terhapus (error 404)" 404 "$status" "$body"

echo "=============================================="
echo "  Hasil Pengujian: $((TOTAL - FAILED))/$TOTAL lulus"
echo "=============================================="

if [ "$FAILED" -gt 0 ]; then
  echo "Ada $FAILED pengujian yang gagal!"
  exit 1
else
  echo "Semua pengujian smoke test BERHASIL!"
  exit 0
fi
