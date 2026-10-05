// Smoke Test runner via Node.js (menggunakan alur auth + format respons baru)
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

let total = 0;
let failed = 0;

function assert(description, condition, details = '') {
  total++;
  if (condition) {
    console.log(`[PASS] ${description}`);
  } else {
    failed++;
    console.error(`[FAIL] ${description} ${details}`);
  }
}

const email = `smoke-${Date.now()}@example.com`;

async function run() {
  console.log(`==============================================`);
  console.log(`  Memulai Smoke Test di ${BASE_URL}`);
  console.log(`==============================================`);

  try {
    // 1. Health check
    const resHealth = await fetch(`${BASE_URL}/api/health`);
    const dataHealth = await resHealth.json();
    assert('GET /api/health (status 200)', resHealth.status === 200 && dataHealth.status === 'ok');

    // 2. Tanpa token -> 401
    const resTau = await fetch(`${BASE_URL}/api/tugas`);
    assert('GET /api/tugas tanpa token (status 401)', resTau.status === 401);

    // 3. Register
    const resReg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: 'Smoke', email, password: 'rahasia123' }),
    });
    const dataReg = await resReg.json();
    assert('POST /api/auth/register (status 201 + token)', resReg.status === 201 && dataReg.token && dataReg.user.email === email);
    const auth = { Authorization: `Bearer ${dataReg.token}` };

    // 4. GET /api/auth/me
    const resMe = await fetch(`${BASE_URL}/api/auth/me`, { headers: auth });
    const dataMe = await resMe.json();
    assert('GET /api/auth/me (status 200)', resMe.status === 200 && dataMe.user.email === email);

    // 5. GET /api/tugas (format pagination)
    const resAll = await fetch(`${BASE_URL}/api/tugas`, { headers: auth });
    const dataAll = await resAll.json();
    assert(
      'GET /api/tugas (status 200 + { data, pagination, counts })',
      resAll.status === 200 && Array.isArray(dataAll.data) && dataAll.pagination && dataAll.counts
    );

    // 6. POST /api/tugas valid (prioritas + tenggat)
    const resPost = await fetch(`${BASE_URL}/api/tugas`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ judul: 'Tugas dari node smoke test', prioritas: 'tinggi', tenggat: '2026-12-31' }),
    });
    const dataPost = await resPost.json();
    assert('POST /api/tugas valid (status 201)', resPost.status === 201 && dataPost.id && dataPost.prioritas === 'tinggi');
    const createdId = dataPost.id;

    // 7. POST /api/tugas empty
    const resPostEmpty = await fetch(`${BASE_URL}/api/tugas`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ judul: '   ' }),
    });
    const dataPostEmpty = await resPostEmpty.json();
    assert('POST /api/tugas judul kosong (status 400)', resPostEmpty.status === 400 && dataPostEmpty.message);

    // 8. POST /api/tugas > 200 chars
    const resPostLong = await fetch(`${BASE_URL}/api/tugas`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ judul: 'A'.repeat(205) }),
    });
    const dataPostLong = await resPostLong.json();
    assert('POST /api/tugas judul > 200 chars (status 400)', resPostLong.status === 400 && dataPostLong.message);

    // 9. GET /api/tugas/:id valid
    const resGetOne = await fetch(`${BASE_URL}/api/tugas/${createdId}`, { headers: auth });
    const dataGetOne = await resGetOne.json();
    assert('GET /api/tugas/:id valid (status 200)', resGetOne.status === 200 && dataGetOne.id === createdId);

    // 10. GET /api/tugas/:id 404
    const resGet404 = await fetch(`${BASE_URL}/api/tugas/999999`, { headers: auth });
    const dataGet404 = await resGet404.json();
    assert('GET /api/tugas/:id tidak ditemukan (status 404)', resGet404.status === 404 && dataGet404.message);

    // 11. GET /api/tugas/:id invalid non-number
    const resGet400 = await fetch(`${BASE_URL}/api/tugas/abc`, { headers: auth });
    const dataGet400 = await resGet400.json();
    assert('GET /api/tugas/:id non-integer (status 400)', resGet400.status === 400 && dataGet400.message);

    // 12. PUT /api/tugas/:id
    const resPut = await fetch(`${BASE_URL}/api/tugas/${createdId}`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ judul: 'Judul Diperbarui', selesai: true }),
    });
    const dataPut = await resPut.json();
    assert('PUT /api/tugas/:id (status 200)', resPut.status === 200 && dataPut.selesai === true && dataPut.judul === 'Judul Diperbarui');

    // 13. PUT /api/tugas/:id empty body
    const resPutEmpty = await fetch(`${BASE_URL}/api/tugas/${createdId}`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const dataPutEmpty = await resPutEmpty.json();
    assert('PUT /api/tugas/:id payload kosong (status 400)', resPutEmpty.status === 400 && dataPutEmpty.message);

    // 14. GET dengan search + pagination
    const resSearch = await fetch(`${BASE_URL}/api/tugas?q=diperbarui&limit=5&page=1&sort=terbaru`, { headers: auth });
    const dataSearch = await resSearch.json();
    assert(
      'GET /api/tugas?q (status 200 + hasil tersaring)',
      resSearch.status === 200 && dataSearch.data.length >= 1 && dataSearch.pagination.limit === 5
    );

    // 15. PATCH /api/tugas/:id/toggle
    const resToggle = await fetch(`${BASE_URL}/api/tugas/${createdId}/toggle`, {
      method: 'PATCH',
      headers: auth,
    });
    const dataToggle = await resToggle.json();
    assert('PATCH /api/tugas/:id/toggle (status 200)', resToggle.status === 200 && dataToggle.selesai === false);

    // 16. DELETE /api/tugas/:id
    const resDel = await fetch(`${BASE_URL}/api/tugas/${createdId}`, {
      method: 'DELETE',
      headers: auth,
    });
    const dataDel = await resDel.json();
    assert('DELETE /api/tugas/:id (status 200)', resDel.status === 200 && dataDel.id === createdId);

    // 17. DELETE /api/tugas/:id again (404)
    const resDel404 = await fetch(`${BASE_URL}/api/tugas/${createdId}`, {
      method: 'DELETE',
      headers: auth,
    });
    const dataDel404 = await resDel404.json();
    assert('DELETE /api/tugas/:id sudah terhapus (status 404)', resDel404.status === 404 && dataDel404.message);

    console.log(`==============================================`);
    console.log(`  Hasil Pengujian: ${total - failed}/${total} lulus`);
    console.log(`==============================================`);

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('Semua pengujian smoke test BERHASIL!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Terjadi kesalahan saat menjalankan smoke test:', err.message);
    process.exit(1);
  }
}

run();
