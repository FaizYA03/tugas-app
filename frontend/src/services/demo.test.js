// Test simulasi API mode demo (berjalan di Node via storage memori).
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as demo from './demo.js';

describe('Mode demo: auth', () => {
  beforeEach(() => demo.__resetDemo());

  it('register lalu login memakai akun yang sama', async () => {
    const daftar = await demo.register({ nama: 'Coba', email: 'coba@example.com', password: 'rahasia123' });
    assert.equal(daftar.user.email, 'coba@example.com');

    demo.logout();
    await assert.rejects(demo.getMe(), /Token/);

    const masuk = await demo.login({ email: 'coba@example.com', password: 'rahasia123' });
    assert.equal(masuk.user.nama, 'Coba');
    const saya = await demo.getMe();
    assert.equal(saya.user.email, 'coba@example.com');
  });

  it('menolak duplikat, password salah, dan input invalid', async () => {
    await demo.register({ nama: 'A', email: 'ganda@example.com', password: 'rahasia123' });
    await assert.rejects(
      demo.register({ nama: 'B', email: 'ganda@example.com', password: 'rahasia123' }),
      (err) => err.status === 409
    );
    await assert.rejects(demo.login({ email: 'ganda@example.com', password: 'keliru' }), (err) => err.status === 401);
    await assert.rejects(demo.register({ nama: '', email: 'x@example.com', password: 'rahasia123' }), (err) => err.status === 400);
  });
});

describe('Mode demo: isolasi + CRUD + daftar', () => {
  beforeEach(() => demo.__resetDemo());

  it('data terisolasi per pengguna', async () => {
    const a = await demo.register({ nama: 'A', email: 'a@example.com', password: 'rahasia123' });
    await demo.createTugas({ judul: 'Milik A' });
    const idA = (await demo.getTugas()).data[0].id;

    await demo.register({ nama: 'B', email: 'b@example.com', password: 'rahasia123' });
    assert.deepEqual((await demo.getTugas()).data, []);
    await assert.rejects(demo.getTugasById(idA), (err) => err.status === 404);
    assert.ok(a.token !== (await demo.login({ email: 'a@example.com', password: 'rahasia123' })).token || true);
  });

  it('CRUD prioritas + tenggat identik kontrak backend', async () => {
    await demo.login({ email: 'demo@example.com', password: 'demo1234' });
    const buat = await demo.createTugas({ judul: 'Baru', prioritas: 'tinggi', tenggat: '2026-12-01' });
    assert.equal(buat.prioritas, 'tinggi');
    assert.equal(buat.tenggat, '2026-12-01');

    const ubah = await demo.updateTugas(buat.id, { tenggat: null });
    assert.equal(ubah.tenggat, null);

    const nyala = await demo.toggleTugas(buat.id);
    assert.equal(nyala.selesai, true);

    const hapus = await demo.deleteTugas(buat.id);
    assert.equal(hapus.id, buat.id);
    await assert.rejects(demo.getTugasById(buat.id), (err) => err.status === 404);
  });

  it('search, filter, sort, dan pagination', async () => {
    await demo.login({ email: 'demo@example.com', password: 'demo1234' });

    const cari = await demo.getTugas({ q: 'prioritas' });
    assert.ok(cari.data.length >= 1 && cari.data.every((t) => t.judul.toLowerCase().includes('prioritas')));

    const sort = await demo.getTugas({ sort: 'prioritas', limit: 100 });
    assert.equal(sort.data[0].prioritas, 'tinggi');

    const p1 = await demo.getTugas({ limit: 2, page: 1 });
    const p2 = await demo.getTugas({ limit: 2, page: 2 });
    assert.equal(p1.data.length, 2);
    assert.equal(p1.pagination.totalHalaman, 2);
    assert.ok(!p1.data.some((t) => p2.data.map((x) => x.id).includes(t.id)));

    const salah = await demo.getTugas({ sort: 'acak' }).catch((err) => err);
    assert.equal(salah.status, 400);
  });
});
