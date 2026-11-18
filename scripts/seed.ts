// Data uji dari prototype Figma (data samaran, NFR-07). Jalankan: npm run db:seed
// Semua data lama dihapus lebih dulu. Jangan dijalankan pada basis data berisi data asli.
//
// Tanggal jatuh tempo dan tindak lanjut di Figma dibuat "per 1 November 2026". Agar penanda H-3, H-1,
// H-0, dan Terlambat tetap tampil seperti di desain, tanggal-tanggal itu digeser relatif ke hari seed dijalankan.
import "dotenv/config";

import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as s from "../src/server/db/schema";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Password uji untuk semua akun seed. Ganti setelah seed bila basis data dipakai bersama.
export const PASSWORD_UJI = "uji-mdp-2026";

const client = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
const db = drizzle(client, { schema: s });

const ZONA = "+07:00";
const hariIni = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
const ACUAN_FIGMA = "2026-11-01";
const geserHari = Math.round((Date.parse(hariIni) - Date.parse(ACUAN_FIGMA)) / 86_400_000);

function geser(tgl: string) {
  const d = new Date(`${tgl}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + geserHari);
  return d.toISOString().slice(0, 10);
}
const jam = (tgl: string, hhmm: string) => new Date(`${tgl}T${hhmm}:00${ZONA}`);
const jamGeser = (tgl: string, hhmm: string) => jam(geser(tgl), hhmm);

const UPLOAD = path.resolve(process.env.UPLOAD_DIR ?? "./storage/uploads");

// PDF satu halaman yang menyatakan dirinya contoh, agar tombol "Lihat Bukti" pada data uji membuka berkas nyata.
function pdfContoh(judul: string) {
  const teks = `Contoh dokumen data uji: ${judul}`.replace(/[()\\]/g, "");
  const isi = `BT /F1 14 Tf 60 760 Td (${teks}) Tj ET`;
  const obj = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${isi.length} >>\nstream\n${isi}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offset: number[] = [];
  obj.forEach((o, i) => {
    offset.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${obj.length + 1}\n0000000000 65535 f \n`;
  for (const o of offset) out += `${String(o).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${obj.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return out;
}

async function berkas(nama: string, judul: string) {
  const rel = `seed/${nama}`;
  await mkdir(path.join(UPLOAD, "seed"), { recursive: true });
  await writeFile(path.join(UPLOAD, rel), pdfContoh(judul));
  return rel;
}

async function main() {
  await db.execute(
    sql`TRUNCATE tindak_lanjut, penerimaan, pengiriman, pembayaran, faktur_barang, faktur, riwayat_produksi, pesanan_barang, pesanan, lokasi_pengiriman, pelanggan, barang, sesi, pengguna CASCADE`,
  );

  // ---------- Pengguna (P-15) ----------
  const hash = await bcrypt.hash(PASSWORD_UJI, 10);
  const U = {
    rina: "USR-ADM-01",
    hendra: "USR-OWN-01",
    sari: "USR-OPS-01",
    dimas: "USR-KRM-01",
    bagus: "USR-PRD-01",
  };
  await db.insert(s.pengguna).values([
    {
      id_pengguna: U.rina,
      nama: "Rina Admin",
      username: "rina.admin",
      email: "rina@menaradigdaya.co.id",
      peran: "Admin",
      password_hash: hash,
    },
    {
      id_pengguna: U.hendra,
      nama: "Hendra Santoso",
      username: "hendra.santoso",
      email: "hendra@menaradigdaya.co.id",
      peran: "Owner",
      password_hash: hash,
    },
    {
      id_pengguna: U.sari,
      nama: "Sari Wulandari",
      username: "sari.w",
      email: "sari@menaradigdaya.co.id",
      peran: "Staf Operasional",
      password_hash: hash,
    },
    {
      id_pengguna: U.dimas,
      nama: "Dimas Pratama",
      username: "dimas.p",
      email: "dimas@menaradigdaya.co.id",
      peran: "Staf Pengiriman",
      password_hash: hash,
    },
    {
      id_pengguna: U.bagus,
      nama: "Bagus Saputra",
      username: "bagus.s",
      email: "bagus@menaradigdaya.co.id",
      peran: "Staf Produksi",
      password_hash: hash,
    },
    {
      id_pengguna: "USR-OPS-02",
      nama: "Andi Kurnia",
      username: "andi.k",
      email: "andi@menaradigdaya.co.id",
      peran: "Staf Operasional",
      password_hash: hash,
      aktif: false,
    },
  ]);

  // ---------- Data master (P-16, P-17) ----------
  await db.insert(s.pelanggan).values([
    {
      id_pelanggan: "PLG-001",
      kode_pelanggan: "SLJ",
      nama_perusahaan: "PT Sinar Logam Jaya",
      alamat: "Jl. Industri Raya No. 21, Bekasi",
      telepon: "021-8900-XXXX",
      kontak: "Bpk. Joko",
    },
    {
      id_pelanggan: "PLG-002",
      kode_pelanggan: "KPL",
      nama_perusahaan: "CV Karya Plastindo",
      alamat: "Tangerang",
      telepon: "021-5520-XXXX",
      kontak: "Ibu Wati",
    },
    {
      id_pelanggan: "PLG-003",
      kode_pelanggan: "ABK",
      nama_perusahaan: "PT Abadi Kemasan",
      alamat: "Karawang",
      telepon: "0267-84-XXXX",
      kontak: "Bpk. Rudi",
    },
    {
      id_pelanggan: "PLG-004",
      kode_pelanggan: "UMB",
      nama_perusahaan: "UD Maju Bersama",
      alamat: "Bogor",
      telepon: "0251-83-XXXX",
      kontak: "Ibu Nani",
    },
  ]);
  const L = {
    cikarang: { id: "LOK-001", plg: "PLG-001", nama: "Gudang Cikarang", alamat: "Kawasan Industri Jababeka Blok C-12" },
    bekasi: { id: "LOK-002", plg: "PLG-001", nama: "Pabrik Bekasi", alamat: "Jl. Industri Raya No. 21" },
    tangerang: { id: "LOK-003", plg: "PLG-002", nama: "Gudang Tangerang", alamat: "Tangerang" },
    karawang: { id: "LOK-004", plg: "PLG-003", nama: "Pabrik Karawang", alamat: "Karawang" },
    bogor: { id: "LOK-005", plg: "PLG-004", nama: "Toko Bogor", alamat: "Bogor" },
  };
  const teksLokasi = (l: (typeof L)[keyof typeof L]) =>
    l.alamat === l.nama.split(" ").pop() ? l.nama : `${l.nama}, ${l.alamat}`;
  await db
    .insert(s.lokasi_pengiriman)
    .values(
      Object.values(L).map((l) => ({ id_lokasi: l.id, id_pelanggan: l.plg, nama_lokasi: l.nama, alamat: l.alamat })),
    );

  const B = {
    sc20: {
      id: "BRG-SC20",
      kode: "SC-20",
      nama: "Seal Caps 20 mm",
      spek: "Aluminium 0,2 mm, cetak logo 1 warna",
      satuan: "buah",
      harga: 35,
    },
    sc24: {
      id: "BRG-SC24",
      kode: "SC-24",
      nama: "Seal Caps 24 mm",
      spek: "Aluminium 0,2 mm, polos",
      satuan: "buah",
      harga: 33,
    },
    sc28: {
      id: "BRG-SC28",
      kode: "SC-28",
      nama: "Seal Caps 28 mm",
      spek: "Aluminium 0,22 mm, polos",
      satuan: "buah",
      harga: 30,
    },
    ln28: { id: "BRG-LN28", kode: "LN-28", nama: "Liner Seal 28 mm", spek: "Foam PE 1 mm", satuan: "pcs", harga: 12 },
  };
  await db.insert(s.barang).values(
    Object.values(B).map((b) => ({
      id_barang: b.id,
      kode_barang: b.kode,
      nama: b.nama,
      spesifikasi: b.spek,
      satuan: b.satuan,
      harga_acuan: b.harga,
    })),
  );

  // ---------- Pesanan (P-03) ----------
  const NAMA_PLG: Record<string, string> = {
    "PLG-001": "PT Sinar Logam Jaya",
    "PLG-002": "CV Karya Plastindo",
    "PLG-003": "PT Abadi Kemasan",
    "PLG-004": "UD Maju Bersama",
  };
  const ALAMAT_PLG: Record<string, string> = {
    "PLG-001": "Jl. Industri Raya No. 21, Bekasi",
    "PLG-002": "Tangerang",
    "PLG-003": "Karawang",
    "PLG-004": "Bogor",
  };
  type Baris = { b: (typeof B)[keyof typeof B]; jumlah: number; harga: number };
  type PO = {
    id: string;
    plg: string;
    lok: (typeof L)[keyof typeof L];
    tgl: string;
    sp: string;
    penawaran?: string;
    jt: string | null;
    ppn: boolean;
    baris: Baris[];
    produksi: s.StatusProduksi;
    alasan?: string;
  };
  const POS: PO[] = [
    {
      id: "PO-2026-0128",
      plg: "PLG-004",
      lok: L.bogor,
      tgl: "2026-09-15",
      sp: "SP/UMB/IX/2026/031",
      jt: geser("2026-11-01"),
      ppn: false,
      baris: [{ b: B.ln28, jumlah: 1_000_000, harga: 12 }],
      produksi: "Selesai",
    },
    {
      id: "PO-2026-0131",
      plg: "PLG-003",
      lok: L.karawang,
      tgl: "2026-09-18",
      sp: "SP/ABK/IX/2026/077",
      jt: geser("2026-11-02"),
      ppn: false,
      baris: [{ b: B.sc28, jumlah: 1_104_000, harga: 30 }],
      produksi: "Dalam Proses",
    },
    {
      id: "PO-2026-0134",
      plg: "PLG-004",
      lok: L.bogor,
      tgl: "2026-09-21",
      sp: "SP/UMB/IX/2026/034",
      jt: "2026-10-21",
      ppn: false,
      baris: [{ b: B.ln28, jumlah: 1_300_000, harga: 12 }],
      produksi: "Selesai",
    },
    {
      id: "PO-2026-0137",
      plg: "PLG-001",
      lok: L.bekasi,
      tgl: "2026-09-25",
      sp: "SP/SLJ/IX/2026/112",
      jt: geser("2026-11-04"),
      ppn: false,
      baris: [{ b: B.sc20, jumlah: 268_000, harga: 35 }],
      produksi: "Dalam Proses",
    },
    {
      id: "PO-2026-0139",
      plg: "PLG-003",
      lok: L.karawang,
      tgl: "2026-09-28",
      sp: "SP/ABK/IX/2026/081",
      jt: geser("2026-10-28"),
      ppn: true,
      baris: [{ b: B.sc24, jumlah: 781_250, harga: 32 }],
      produksi: "Selesai",
    },
    {
      id: "PO-2026-0141",
      plg: "PLG-002",
      lok: L.tangerang,
      tgl: "2026-09-30",
      sp: "SP/KPL/IX/2026/019",
      jt: "2026-10-30",
      ppn: true,
      baris: [{ b: B.sc28, jumlah: 400_000, harga: 27.5 }],
      produksi: "Selesai",
    },
    {
      id: "PO-2026-0142",
      plg: "PLG-001",
      lok: L.cikarang,
      tgl: "2026-10-02",
      sp: "SP/SLJ/IX/2026/118",
      penawaran: "SPH/MDP/IX/2026/045",
      jt: geser("2026-11-15"),
      ppn: true,
      baris: [
        { b: B.sc20, jumlah: 1_000_000, harga: 38 },
        { b: B.sc28, jumlah: 200_000, harga: 30 },
      ],
      produksi: "Selesai",
    },
    {
      id: "PO-2026-0144",
      plg: "PLG-002",
      lok: L.tangerang,
      tgl: "2026-10-05",
      sp: "SP/KPL/X/2026/022",
      jt: null,
      ppn: true,
      baris: [{ b: B.sc24, jumlah: 300_000, harga: 35 }],
      produksi: "Tertunda",
      alasan: "Bahan baku aluminium 0,2 mm belum datang dari pemasok.",
    },
  ];

  const totalPO = new Map<string, number>();
  for (const po of POS) {
    const subtotal = po.baris.reduce((t, x) => t + Math.round(x.jumlah * x.harga), 0);
    const ppn = po.ppn ? Math.round(subtotal * 0.11) : 0;
    totalPO.set(po.id, subtotal + ppn);
    await db.insert(s.pesanan).values({
      id_pesanan: po.id,
      id_pelanggan: po.plg,
      tanggal_po: po.tgl,
      jenis_barang: po.baris.map((x) => x.b.nama).join(", "),
      jumlah_pesanan: po.baris.reduce((t, x) => t + x.jumlah, 0),
      nomor_surat_pemesanan: po.sp,
      rujukan_penawaran: po.penawaran ?? null,
      id_lokasi: po.lok.id,
      nama_pelanggan: NAMA_PLG[po.plg],
      alamat_pelanggan: ALAMAT_PLG[po.plg],
      lokasi_pengiriman: teksLokasi(po.lok),
      ketentuan_pembayaran: "30 hari setelah nota",
      tanggal_jatuh_tempo: po.jt,
      termasuk_ppn: po.ppn,
      subtotal,
      ppn,
      total: subtotal + ppn,
      status_produksi: po.produksi,
      alasan_tertunda: po.alasan ?? null,
      dibuat_oleh: U.rina,
      dibuat_pada: jam(po.tgl, "09:00"),
    });
    await db.insert(s.pesanan_barang).values(
      po.baris.map((x, i) => ({
        id_pesanan_barang: `${po.id}-B${i + 1}`,
        id_pesanan: po.id,
        id_barang: x.b.id,
        urutan: i + 1,
        kode_barang: x.b.kode,
        nama_barang: x.b.nama,
        spesifikasi: x.b.spek,
        satuan: x.b.satuan,
        jumlah: x.jumlah,
        harga_satuan: x.harga,
        subtotal: Math.round(x.jumlah * x.harga),
      })),
    );
  }

  // ---------- Riwayat produksi (P-05d, P-14) ----------
  const prod = (id: string, po: string, status: s.StatusProduksi, tgl: string, hhmm: string, catatan?: string) => ({
    id_riwayat: id,
    id_pesanan: po,
    status,
    catatan: catatan ?? null,
    diubah_oleh: U.bagus,
    dibuat_pada: jam(tgl, hhmm),
  });
  await db
    .insert(s.riwayat_produksi)
    .values([
      prod("RP-01", "PO-2026-0142", "Dalam Proses", "2026-10-03", "08:15", "Produksi dimulai."),
      prod("RP-02", "PO-2026-0142", "Selesai", "2026-10-14", "16:20", "Seluruh 1.200.000 buah selesai diproduksi."),
      prod("RP-03", "PO-2026-0144", "Dalam Proses", "2026-10-06", "08:00", "Produksi dimulai."),
      prod(
        "RP-04",
        "PO-2026-0144",
        "Tertunda",
        "2026-10-29",
        "10:30",
        "Bahan baku aluminium 0,2 mm belum datang dari pemasok.",
      ),
      prod("RP-05", "PO-2026-0131", "Dalam Proses", "2026-10-20", "08:10"),
      prod("RP-06", "PO-2026-0137", "Dalam Proses", "2026-10-27", "08:05"),
      prod("RP-07", "PO-2026-0141", "Selesai", "2026-10-08", "15:40"),
      prod("RP-08", "PO-2026-0139", "Selesai", "2026-10-04", "15:00"),
      prod("RP-09", "PO-2026-0134", "Selesai", "2026-09-29", "14:00"),
      prod("RP-10", "PO-2026-0128", "Selesai", "2026-09-26", "14:30"),
    ]);

  // ---------- Nota Faktur (P-06) ----------
  type Nota = {
    id: string;
    nomor: string;
    po: string;
    tgl: string;
    baris: { pb: string; banyaknya: number }[];
    oleh: string;
    jamBuat?: string;
  };
  const NOTA: Nota[] = [
    {
      id: "NF-0076",
      nomor: "NF/09/2026/0076",
      po: "PO-2026-0134",
      tgl: "2026-09-25",
      baris: [{ pb: "PO-2026-0134-B1", banyaknya: 1_300_000 }],
      oleh: U.sari,
    },
    {
      id: "NF-0079",
      nomor: "NF/09/2026/0079",
      po: "PO-2026-0139",
      tgl: "2026-09-30",
      baris: [{ pb: "PO-2026-0139-B1", banyaknya: 781_250 }],
      oleh: U.sari,
    },
    {
      id: "NF-0080",
      nomor: "NF/10/2026/0080",
      po: "PO-2026-0141",
      tgl: "2026-10-01",
      baris: [{ pb: "PO-2026-0141-B1", banyaknya: 400_000 }],
      oleh: U.sari,
    },
    {
      id: "NF-0081",
      nomor: "NF/10/2026/0081",
      po: "PO-2026-0128",
      tgl: "2026-10-01",
      baris: [{ pb: "PO-2026-0128-B1", banyaknya: 1_000_000 }],
      oleh: U.sari,
    },
    {
      id: "NF-0084",
      nomor: "NF/10/2026/0084",
      po: "PO-2026-0137",
      tgl: "2026-10-05",
      baris: [{ pb: "PO-2026-0137-B1", banyaknya: 268_000 }],
      oleh: U.sari,
    },
    {
      id: "NF-0087",
      nomor: "NF/10/2026/0087",
      po: "PO-2026-0142",
      tgl: "2026-10-05",
      baris: [{ pb: "PO-2026-0142-B1", banyaknya: 600_000 }],
      oleh: U.sari,
    },
    {
      id: "NF-0089",
      nomor: "NF/10/2026/0089",
      po: "PO-2026-0131",
      tgl: "2026-10-09",
      baris: [{ pb: "PO-2026-0131-B1", banyaknya: 1_104_000 }],
      oleh: U.sari,
    },
    {
      id: "NF-0091",
      nomor: "NF/10/2026/0091",
      po: "PO-2026-0142",
      tgl: "2026-10-16",
      baris: [
        { pb: "PO-2026-0142-B1", banyaknya: 400_000 },
        { pb: "PO-2026-0142-B2", banyaknya: 200_000 },
      ],
      oleh: U.sari,
      jamBuat: "09:05",
    },
    {
      id: "NF-0093",
      nomor: "NF/10/2026/0093",
      po: "PO-2026-0144",
      tgl: "2026-10-20",
      baris: [{ pb: "PO-2026-0144-B1", banyaknya: 300_000 }],
      oleh: U.sari,
    },
  ];
  const barisPO = await db.select().from(s.pesanan_barang);
  const poPpn = new Map(POS.map((p) => [p.id, p.ppn]));
  for (const n of NOTA) {
    const items = n.baris.map((x, i) => {
      const pb = barisPO.find((r) => r.id_pesanan_barang === x.pb);
      if (!pb) throw new Error(`Baris ${x.pb} tidak ada`);
      return {
        id_faktur_barang: `${n.id}-B${i + 1}`,
        id_faktur: n.id,
        id_pesanan_barang: pb.id_pesanan_barang,
        urutan: i + 1,
        nama_barang: pb.nama_barang,
        satuan: pb.satuan,
        banyaknya: x.banyaknya,
        harga_satuan: pb.harga_satuan,
        jumlah: Math.round(x.banyaknya * pb.harga_satuan),
      };
    });
    const sub = items.reduce((t, x) => t + x.jumlah, 0);
    const total = poPpn.get(n.po) ? sub + Math.round(sub * 0.11) : sub;
    await db.insert(s.faktur).values({
      id_faktur: n.id,
      id_pesanan: n.po,
      nomor_nota: n.nomor,
      tanggal_faktur: n.tgl,
      nominal_faktur: total,
      dibuat_oleh: n.oleh,
      dibuat_pada: jam(n.tgl, n.jamBuat ?? "09:00"),
    });
    await db.insert(s.faktur_barang).values(items);
  }

  // ---------- Pembayaran (P-07, P-05b) ----------
  const bukti = await berkas("bukti-setor-contoh.pdf", "bukti setor bank");
  const bayar = (
    id: string,
    nota: string,
    tgl: string,
    hhmm: string,
    nominal: number,
    metode: string,
    penyetor: string,
    status: s.StatusVerifikasi,
    verif?: [string, string],
  ) => ({
    id_pembayaran: id,
    id_faktur: nota,
    tanggal_pembayaran: tgl,
    waktu_pembayaran: jam(tgl, hhmm),
    nominal_pembayaran: nominal,
    metode,
    nomor_referensi: `REF${tgl.replaceAll("-", "").slice(2)}${id.slice(-3)}`,
    berita_transaksi: `Pembayaran ${nota.replace("NF-", "NF ")}`,
    nama_penyetor: penyetor,
    bukti_pembayaran: bukti,
    nama_file_bukti: "bukti-setor-contoh.pdf",
    status_verifikasi: status,
    dicatat_oleh: U.sari,
    diverifikasi_oleh: verif ? U.rina : null,
    diverifikasi_pada: verif ? jam(verif[0], verif[1]) : null,
    dibuat_pada: jam(tgl, hhmm),
  });
  await db
    .insert(s.pembayaran)
    .values([
      bayar(
        "BYR-001",
        "NF-0087",
        "2026-10-08",
        "10:22",
        25_308_000,
        "Setor Tunai",
        "PT Sinar Logam Jaya",
        "Terverifikasi",
        ["2026-10-08", "15:10"],
      ),
      bayar(
        "BYR-002",
        "NF-0091",
        "2026-10-20",
        "13:05",
        10_000_000,
        "Transfer",
        "PT Sinar Logam Jaya",
        "Terverifikasi",
        ["2026-10-24", "14:20"],
      ),
      bayar(
        "BYR-003",
        "NF-0091",
        "2026-10-28",
        "09:47",
        5_000_000,
        "Transfer",
        "PT Sinar Logam Jaya",
        "Menunggu Verifikasi",
      ),
      bayar(
        "BYR-004",
        "NF-0080",
        "2026-10-20",
        "11:15",
        12_210_000,
        "Transfer",
        "CV Karya Plastindo",
        "Terverifikasi",
        ["2026-10-21", "09:30"],
      ),
      bayar("BYR-005", "NF-0076", "2026-10-15", "10:00", 15_650_000, "Transfer", "UD Maju Bersama", "Terverifikasi", [
        "2026-10-16",
        "08:45",
      ]),
      bayar("BYR-006", "NF-0081", "2026-10-22", "14:40", 3_600_000, "Setor Tunai", "UD Maju Bersama", "Terverifikasi", [
        "2026-10-23",
        "10:05",
      ]),
    ]);

  // ---------- Pengiriman (P-12, P-13) ----------
  const ttb0233 = await berkas("ttb-0233-pindai.pdf", "Tanda Terima Barang TTB/10/2026/0233");
  const resiContoh = await berkas("resi-ekspedisi-contoh.pdf", "resi ekspedisi");
  const ttbContoh = await berkas("ttb-contoh.pdf", "Tanda Terima Barang");
  const kirim = (
    id: string,
    po: string,
    jenis: s.JenisPengiriman,
    no: string,
    tgl: string,
    status: s.StatusPengiriman,
    dok: string,
    file: string,
  ) => ({
    id_pengiriman: id,
    id_pesanan: po,
    jenis_pengiriman: jenis,
    ekspedisi: jenis === "Ekspedisi" ? "Ekspedisi Lintas Jawa" : null,
    nomor_resi: jenis === "Ekspedisi" ? no : null,
    jumlah_koli: jenis === "Ekspedisi" ? 40 : null,
    nomor_tanda_terima: jenis === "Antar Langsung" ? no : null,
    tanggal_pengiriman: tgl,
    status_pengiriman: status,
    dokumen: dok,
    nama_file_dokumen: file,
    dicatat_oleh: U.dimas,
    dibuat_pada: jam(tgl, "08:40"),
  });
  await db
    .insert(s.pengiriman)
    .values([
      kirim(
        "KRM-001",
        "PO-2026-0142",
        "Ekspedisi",
        "LJ2610140098",
        "2026-10-14",
        "Selesai",
        resiContoh,
        "resi-ekspedisi-contoh.pdf",
      ),
      kirim(
        "KRM-002",
        "PO-2026-0142",
        "Antar Langsung",
        "TTB/10/2026/0233",
        "2026-10-27",
        "Dalam Kirim",
        ttb0233,
        "ttb-0233-pindai.pdf",
      ),
      kirim(
        "KRM-003",
        "PO-2026-0141",
        "Antar Langsung",
        "TTB/10/2026/0219",
        "2026-10-09",
        "Selesai",
        ttbContoh,
        "ttb-contoh.pdf",
      ),
      kirim(
        "KRM-004",
        "PO-2026-0139",
        "Ekspedisi",
        "LJ2610060051",
        "2026-10-06",
        "Selesai",
        resiContoh,
        "resi-ekspedisi-contoh.pdf",
      ),
      kirim(
        "KRM-005",
        "PO-2026-0134",
        "Antar Langsung",
        "TTB/09/2026/0198",
        "2026-09-30",
        "Selesai",
        ttbContoh,
        "ttb-contoh.pdf",
      ),
      kirim(
        "KRM-006",
        "PO-2026-0128",
        "Antar Langsung",
        "TTB/09/2026/0191",
        "2026-09-27",
        "Selesai",
        ttbContoh,
        "ttb-contoh.pdf",
      ),
    ]);
  await db.insert(s.penerimaan).values([
    {
      id_penerimaan: "TRM-001",
      id_pengiriman: "KRM-001",
      tanggal_penerimaan: "2026-10-16",
      dicatat_oleh: U.dimas,
      dibuat_pada: jam("2026-10-16", "15:00"),
    },
    {
      id_penerimaan: "TRM-003",
      id_pengiriman: "KRM-003",
      tanggal_penerimaan: "2026-10-09",
      dicatat_oleh: U.dimas,
      dibuat_pada: jam("2026-10-09", "15:00"),
    },
    {
      id_penerimaan: "TRM-004",
      id_pengiriman: "KRM-004",
      tanggal_penerimaan: "2026-10-08",
      dicatat_oleh: U.dimas,
      dibuat_pada: jam("2026-10-08", "15:00"),
    },
    {
      id_penerimaan: "TRM-005",
      id_pengiriman: "KRM-005",
      tanggal_penerimaan: "2026-09-30",
      dicatat_oleh: U.dimas,
      dibuat_pada: jam("2026-09-30", "15:00"),
    },
    {
      id_penerimaan: "TRM-006",
      id_pengiriman: "KRM-006",
      tanggal_penerimaan: "2026-09-27",
      dicatat_oleh: U.dimas,
      dibuat_pada: jam("2026-09-27", "15:00"),
    },
  ]);

  // ---------- Tindak lanjut (P-11) ----------
  await db.insert(s.tindak_lanjut).values([
    {
      id_tindak_lanjut: "TL-001",
      id_faktur: "NF-0079",
      waktu: jamGeser("2026-10-24", "10:45"),
      status_komunikasi: "Dihubungi lewat telepon",
      catatan: "Tidak tersambung, dijadwalkan hubungi ulang.",
      dicatat_oleh: U.rina,
    },
    {
      id_tindak_lanjut: "TL-002",
      id_faktur: "NF-0079",
      waktu: jamGeser("2026-10-29", "14:10"),
      status_komunikasi: "Dihubungi lewat WhatsApp",
      catatan: "Pelanggan meminta salinan nota dan janji membayar minggu depan.",
      pengingat_berikutnya: jamGeser("2026-11-01", "10:00"),
      dicatat_oleh: U.rina,
    },
  ]);

  console.log(`Seed selesai. Jatuh tempo digeser ${geserHari} hari dari acuan Figma ${ACUAN_FIGMA}.`);
  for (const [id, total] of totalPO) console.log(`  ${id}  Rp${total.toLocaleString("id-ID")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => client.end());
