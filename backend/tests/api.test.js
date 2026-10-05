// Automated test backend: node:test + supertest, berjalan di atas mock DB
// (DATABASE_URL dikosongkan paksa) sehingga tidak butuh PostgreSQL lokal.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-minimal-32-karakter-aman';
delete process.env.DATABASE_URL;

const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const db = require('../src/db');
const app = require('../src/index');

if (!db.isMock()) {
  throw new Error('Test harus berjalan di atas mock DB (DATABASE_URL harus kosong)');
}

const daftarkan = async (email, password = 'rahasia123', nama = 'Penguji') => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ nama, email, password });
  assert.equal(res.status, 201);
  return res.body; // { user, token }
};

describe('Auth (register/login/me)', () => {
  beforeEach(() => db.resetMock());

  it('register mengembalikan user + token JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nama: 'Budi', email: 'budi@example.com', password: 'rahasia123' });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, 'budi@example.com');
    assert.match(res.body.token, /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    assert.ok(!('password_hash' in res.body.user));
  });

  it('register menolak email duplikat (409)', async () => {
    await daftarkan('ganda@example.com');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nama: 'Lain', email: 'ganda@example.com', password: 'rahasia123' });
    assert.equal(res.status, 409);
  });

  it('register menolak email invalid, nama kosong, password pendek', async () => {
    const kasus = [
      { nama: 'A', email: 'bukan-email', password: 'rahasia123' },
      { nama: '   ', email: 'a@example.com', password: 'rahasia123' },
      { nama: 'A', email: 'a@example.com', password: 'pendek' },
    ];
    for (const body of kasus) {
      const res = await request(app).post('/api/auth/register').send(body);
      assert.equal(res.status, 400);
    }
  });

  it('login berhasil dan gagal dengan pesan generik', async () => {
    await daftarkan('masuk@example.com', 'katasandi99');
    const ok = await request(app)
      .post('/api/auth/login')
      .send({ email: 'masuk@example.com', password: 'katasandi99' });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token);

    const salah = await request(app)
      .post('/api/auth/login')
      .send({ email: 'masuk@example.com', password: 'salah-password' });
    assert.equal(salah.status, 401);
    assert.equal(salah.body.message, 'Email atau kata sandi salah');
  });

  it('GET /me butuh token valid', async () => {
    const { token, user } = await daftarkan('saya@example.com');
    const ok = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    assert.equal(ok.status, 200);
    assert.equal(ok.body.user.email, user.email);

    const tanpa = await request(app).get('/api/auth/me');
    assert.equal(tanpa.status, 401);

    const rusak = await request(app).get('/api/auth/me').set('Authorization', 'Bearer token-rusak');
    assert.equal(rusak.status, 401);
  });
});

describe('Isolasi data per pengguna', () => {
  let a;
  let b;

  before(async () => {
    db.resetMock();
    a = await daftarkan('a@example.com');
    b = await daftarkan('b@example.com');
  });

  it('tugas user A tak terlihat & tak bisa diutak-atik user B', async () => {
    const buat = await request(app)
      .post('/api/tugas')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ judul: 'Rahasia A' });
    assert.equal(buat.status, 201);

    const listB = await request(app).get('/api/tugas').set('Authorization', `Bearer ${b.token}`);
    assert.equal(listB.status, 200);
    assert.deepEqual(listB.body.data, []);

    for (const [metode, url] of [
      ['get', `/api/tugas/${buat.body.id}`],
      ['patch', `/api/tugas/${buat.body.id}/toggle`],
      ['delete', `/api/tugas/${buat.body.id}`],
    ]) {
      const res = await request(app)[metode](url).set('Authorization', `Bearer ${b.token}`);
      assert.equal(res.status, 404);
    }
  });

  it('rute tugas tanpa token ditolak 401', async () => {
    const res = await request(app).get('/api/tugas');
    assert.equal(res.status, 401);
  });
});

describe('CRUD tugas (prioritas + tenggat)', () => {
  let token;

  before(async () => {
    db.resetMock();
    ({ token } = await daftarkan('crud@example.com'));
  });

  const auth = (req) => req.set('Authorization', `Bearer ${token}`);

  it('create menyimpan prioritas & tenggat', async () => {
    const res = await auth(request(app).post('/api/tugas')).send({
      judul: 'Laporan Q4',
      prioritas: 'tinggi',
      tenggat: '2026-12-31',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.prioritas, 'tinggi');
    assert.ok(res.body.tenggat.startsWith('2026-12-31'));
  });

  it('create memakai default sedang + tanpa tenggat', async () => {
    const res = await auth(request(app).post('/api/tugas')).send({ judul: 'Biasa saja' });
    assert.equal(res.status, 201);
    assert.equal(res.body.prioritas, 'sedang');
    assert.equal(res.body.tenggat, null);
  });

  it('create menolak prioritas & tenggat invalid', async () => {
    for (const body of [
      { judul: 'X', prioritas: 'super' },
      { judul: 'X', tenggat: '31-12-2026' },
      { judul: 'X', tenggat: '2026-02-30' },
      { judul: 'X', tenggat: 'besok' },
    ]) {
      const res = await auth(request(app).post('/api/tugas')).send(body);
      assert.equal(res.status, 400);
    }
  });

  it('PUT menggabungkan field (merge) dan null menghapus tenggat', async () => {
    const buat = await auth(request(app).post('/api/tugas')).send({
      judul: 'Akan diubah', prioritas: 'rendah', tenggat: '2026-11-01',
    });
    const id = buat.body.id;

    const ubah = await auth(request(app).put(`/api/tugas/${id}`)).send({ prioritas: 'tinggi' });
    assert.equal(ubah.status, 200);
    assert.equal(ubah.body.judul, 'Akan diubah');
    assert.equal(ubah.body.prioritas, 'tinggi');
    assert.ok(ubah.body.tenggat.startsWith('2026-11-01'));

    const hapus = await auth(request(app).put(`/api/tugas/${id}`)).send({ tenggat: null });
    assert.equal(hapus.status, 200);
    assert.equal(hapus.body.tenggat, null);
  });

  it('toggle membalik status, delete menghapus', async () => {
    const buat = await auth(request(app).post('/api/tugas')).send({ judul: 'Centang aku' });
    const id = buat.body.id;

    const on = await auth(request(app).patch(`/api/tugas/${id}/toggle`));
    assert.equal(on.status, 200);
    assert.equal(on.body.selesai, true);

    const off = await auth(request(app).patch(`/api/tugas/${id}/toggle`));
    assert.equal(off.body.selesai, false);

    const hapus = await auth(request(app).delete(`/api/tugas/${id}`));
    assert.equal(hapus.status, 200);

    const hilang = await auth(request(app).get(`/api/tugas/${id}`));
    assert.equal(hilang.status, 404);
  });
});

describe('Daftar: search, filter, sort, pagination', () => {
  let token;

  before(async () => {
    db.resetMock();
    ({ token } = await daftarkan('list@example.com'));
    const data = [
      { judul: 'Belajar React hooks', prioritas: 'tinggi', tenggat: '2026-10-10' },
      { judul: 'Belajar Express middleware', prioritas: 'sedang', tenggat: '2026-10-05' },
      { judul: 'Cuci motor sore ini', prioritas: 'rendah', tenggat: null },
      { judul: 'Belajar PostgreSQL indexing', prioritas: 'sedang', tenggat: '2026-10-01' },
    ];
    for (const body of data) {
      await request(app).post('/api/tugas').set('Authorization', `Bearer ${token}`).send(body);
    }
    // Tandai satu tugas selesai (id terbesar = terakhir dibuat)
    const list = await request(app).get('/api/tugas?limit=100').set('Authorization', `Bearer ${token}`);
    const target = list.body.data.find((t) => t.judul.startsWith('Cuci motor'));
    await request(app).patch(`/api/tugas/${target.id}/toggle`).set('Authorization', `Bearer ${token}`);
  });

  const get = (qs) => request(app).get(`/api/tugas${qs}`).set('Authorization', `Bearer ${token}`);

  it('pencarian q tidak case-sensitive', async () => {
    const res = await get('?q=belajar&limit=100');
    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 3);
    assert.equal(res.body.pagination.total, 3);
  });

  it('filter status + counts konsisten', async () => {
    const aktif = await get('?status=aktif&limit=100');
    assert.ok(aktif.body.data.every((t) => !t.selesai));
    const selesai = await get('?status=selesai&limit=100');
    assert.ok(selesai.body.data.every((t) => t.selesai));
    assert.equal(aktif.body.counts.semua, 4);
    assert.equal(aktif.body.counts.aktif + aktif.body.counts.selesai, 4);
  });

  it('filter prioritas', async () => {
    const res = await get('?prioritas=tinggi&limit=100');
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].judul, 'Belajar React hooks');
  });

  it('sort tenggat menaruh tanpa-tenggat paling belakang', async () => {
    const res = await get('?sort=tenggat&limit=100');
    const judul = res.body.data.map((t) => t.judul);
    assert.deepEqual(judul, [
      'Belajar PostgreSQL indexing',
      'Belajar Express middleware',
      'Belajar React hooks',
      'Cuci motor sore ini',
    ]);
  });

  it('sort prioritas: tinggi dulu', async () => {
    const res = await get('?sort=prioritas&limit=100');
    assert.equal(res.body.data[0].prioritas, 'tinggi');
  });

  it('pagination membagi halaman dengan benar', async () => {
    const p1 = await get('?limit=2&page=1');
    const p2 = await get('?limit=2&page=2');
    const p3 = await get('?limit=2&page=3');
    assert.equal(p1.body.data.length, 2);
    assert.equal(p2.body.data.length, 2);
    assert.equal(p3.body.data.length, 0);
    assert.equal(p1.body.pagination.total, 4);
    assert.equal(p1.body.pagination.totalHalaman, 2);
    const ids1 = p1.body.data.map((t) => t.id);
    const ids2 = p2.body.data.map((t) => t.id);
    assert.ok(ids1.every((id) => !ids2.includes(id)));
  });

  it('parameter invalid ditolak 400', async () => {
    for (const qs of ['?sort=acak', '?status=awesome', '?page=0', '?limit=101', '?prioritas=super']) {
      const res = await get(qs);
      assert.equal(res.status, 400, qs);
    }
  });
});
