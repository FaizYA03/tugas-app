#!/usr/bin/env bash

# Smoke Test REST API Daftar Tugas
# Menguji seluruh endpoint API dengan curl termasuk kasus error

BASE_URL="${BASE_URL:-http://localhost:3000}"
FAILED=0
TOTAL=0

echo "=============================================="
echo "  Memulai Smoke Test API di $BASE_URL"
echo "=============================================="

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

# 1. Health check
res=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "GET /api/health" 200 "$status" "$body"

# 2. Get all tugas
res=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/tugas")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "GET /api/tugas" 200 "$status" "$body"

# 3. Create tugas (Valid)
res=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/tugas" \
  -H "Content-Type: application/json" \
  -d '{"judul":"Tugas dari smoke test"}')
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "POST /api/tugas (sukses 201)" 201 "$status" "$body"

# Ambil ID tugas yang baru dibuat
TUGAS_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -n1 | cut -d':' -f2)
if [ -z "$TUGAS_ID" ]; then
  TUGAS_ID=1
fi

# 4. Create tugas - Judul kosong (Error 400)
res=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/tugas" \
  -H "Content-Type: application/json" \
  -d '{"judul":"   "}')
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "POST /api/tugas judul kosong (error 400)" 400 "$status" "$body"

# 5. Create tugas - Judul > 200 karakter (Error 400)
LONG_TITLE=$(printf 'A%.0s' {1..205})
res=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/tugas" \
  -H "Content-Type: application/json" \
  -d "{\"judul\":\"$LONG_TITLE\"}")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "POST /api/tugas judul > 200 karakter (error 400)" 400 "$status" "$body"

# 6. Get tugas by ID
res=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/tugas/$TUGAS_ID")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "GET /api/tugas/:id (sukses 200)" 200 "$status" "$body"

# 7. Get tugas by ID - Not Found (404)
res=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/tugas/999999")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "GET /api/tugas/:id tidak ditemukan (error 404)" 404 "$status" "$body"

# 8. Get tugas by ID - ID tidak valid (400)
res=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/tugas/invalid-id")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "GET /api/tugas/:id non-integer (error 400)" 400 "$status" "$body"

# 9. Update tugas PUT /api/tugas/:id
res=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/tugas/$TUGAS_ID" \
  -H "Content-Type: application/json" \
  -d '{"judul":"Tugas telah diperbarui","selesai":true}')
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "PUT /api/tugas/:id (sukses 200)" 200 "$status" "$body"

# 10. Update tugas - payload kosong (400)
res=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/tugas/$TUGAS_ID" \
  -H "Content-Type: application/json" \
  -d '{}')
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "PUT /api/tugas/:id tanpa body (error 400)" 400 "$status" "$body"

# 11. Toggle tugas PATCH /api/tugas/:id/toggle
res=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/api/tugas/$TUGAS_ID/toggle")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "PATCH /api/tugas/:id/toggle (sukses 200)" 200 "$status" "$body"

# 12. Delete tugas DELETE /api/tugas/:id
res=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/tugas/$TUGAS_ID")
body=$(echo "$res" | sed '$d')
status=$(echo "$res" | tail -n1)
assert_status "DELETE /api/tugas/:id (sukses 200)" 200 "$status" "$body"

# 13. Delete tugas yang sudah dihapus (404)
res=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/tugas/$TUGAS_ID")
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
