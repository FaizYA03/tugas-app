const NAMA_BULAN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

/**
 * Normalisasi nilai tenggat dari server (ISO datetime / YYYY-MM-DD / null)
 * menjadi YYYY-MM-DD atau string kosong untuk <input type="date">.
 */
export function tenggatKeInput(nilai) {
  if (!nilai) return '';
  const teks = String(nilai);
  const cocok = teks.match(/^(\d{4}-\d{2}-\d{2})/);
  return cocok ? cocok[1] : '';
}

/**
 * Menghitung selisih hari kalender (zona lokal) antara hari ini dan tenggat.
 * Negatif = terlambat, 0 = hari ini, positif = sisa hari.
 */
function selisihHari(tenggatInput) {
  const [thn, bln, tgl] = tenggatInput.split('-').map(Number);
  const tenggat = new Date(thn, bln - 1, tgl);
  const sekarang = new Date();
  const hariIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
  return Math.round((tenggat - hariIni) / 86400000);
}

function formatTanggalSingkat(tenggatInput) {
  const [thn, bln, tgl] = tenggatInput.split('-').map(Number);
  return `${tgl} ${NAMA_BULAN[bln - 1]} ${thn}`;
}

/**
 * Label tenggat ramah manusia beserta tone warnanya.
 * Tugas yang sudah selesai selalu memakai tone netral.
 */
export function labelTenggat(nilai, selesai) {
  const input = tenggatKeInput(nilai);
  if (!input) return null;

  const selisih = selisihHari(input);
  const tanggal = formatTanggalSingkat(input);

  if (selesai) {
    return { teks: tanggal, tone: 'netral' };
  }
  if (selisih < 0) {
    const hari = Math.abs(selisih);
    return { teks: `Terlambat ${hari} hari • ${tanggal}`, tone: 'bahaya' };
  }
  if (selisih === 0) {
    return { teks: 'Hari ini', tone: 'peringatan' };
  }
  if (selisih === 1) {
    return { teks: 'Besok', tone: 'peringatan' };
  }
  if (selisih <= 7) {
    return { teks: `${selisih} hari lagi`, tone: 'peringatan' };
  }
  return { teks: tanggal, tone: 'netral' };
}

export const LABEL_PRIORITAS = {
  tinggi: 'Tinggi',
  sedang: 'Sedang',
  rendah: 'Rendah',
};
