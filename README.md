# Sistem Informasi Terintegrasi PT Menara Digdaya Perkasa

Prototype aplikasi web internal yang menautkan setiap PO dengan tagihan, pembayaran, status produksi, dan pengirimannya. Dibangun dari PRD dan SRS Week 7 tim Array of Light, desain Figma "Design System - Capstone", dan template [next-shadcn-admin-dashboard](https://github.com/arhamkhnz/next-shadcn-admin-dashboard) (lisensi MIT).

Semua data di basis data adalah **data uji samaran** dari prototype Figma, bukan data asli perusahaan (NFR-07).

## Teknologi

- Next.js 16 (App Router, Server Actions), React 19, TypeScript
- Tailwind CSS v4, shadcn/ui, font Geist
- PostgreSQL 17 lewat Docker Compose, Drizzle ORM
- Autentikasi JWT (`jose`): access token 1 jam, refresh token 1 bulan yang tersimpan sebagai sesi dan bisa dicabut

## Menjalankan

Prasyarat: Node.js 22 atau lebih baru, Docker Desktop.

```bash
npm install
cp .env.example .env   # isi JWT_ACCESS_SECRET dan JWT_REFRESH_SECRET, lihat petunjuk di file
npm run db:up          # menjalankan PostgreSQL di port 5433
npm run db:push        # membuat tabel dari skema
npm run db:seed        # mengisi data uji (menghapus data lama)
npm run dev            # http://localhost:3000
```

Akun uji (semua memakai password uji yang sama, lihat konstanta `PASSWORD_UJI` di `scripts/seed.ts`):

| Username | Peran |
| --- | --- |
| `rina.admin` | Admin |
| `hendra.santoso` | Owner |
| `sari.w` | Staf Operasional |
| `dimas.p` | Staf Pengiriman |
| `bagus.s` | Staf Produksi |
| `andi.k` | Staf Operasional (nonaktif, untuk uji login ditolak) |

Seed menggeser tanggal jatuh tempo relatif ke hari dijalankan, agar penanda H-3 sampai Terlambat tampil seperti di desain.

## Perintah lain

| Perintah | Fungsi |
| --- | --- |
| `npm test` | Tes logika status tagihan, penanda jatuh tempo, PPN, dan status pengiriman |
| `npm run db:generate` | Membuat file migrasi SQL dari skema ke `drizzle/` |
| `npm run check` | Biome lint dan format |
| `npm run build` | Build produksi |

## Deploy

Produksi berjalan sebagai stack Docker Compose di VPS yang sama dengan portal-aplikasi-gereja: container `mdp-app` (Next.js) + `mdp-db` (PostgreSQL 17), diekspos lewat Cloudflare Tunnel yang sudah ada (tanpa Nginx vhost atau certbot di host). Setiap push ke `main`, GitHub Actions menjalankan cek tipe dan tes, membangun image, push ke GHCR, lalu VPS menarik image itu dan menjalankan migrasi sebelum container diganti.

| Berkas | Fungsi |
| --- | --- |
| `Dockerfile` | Target `runner` (Next.js standalone) dan `migrator` (Drizzle migrate) |
| `docker-compose.prod.yml` | `app` + `db` + job `migrate`, volume data dan unggahan |
| `.github/workflows/deploy.yml` | Lint, tes, build, push GHCR, deploy lewat SSH |
| `deploy/vps-setup.sh` | Bootstrap sekali jalan di VPS: cek prasyarat, buat `/opt/stacks/mdp-app`, isi `.env` |
| `.env.production.example` | Template `.env` untuk VPS |

Panduan lengkap (secrets yang dibutuhkan, deploy pertama, rollback, backup harian, checklist go-live): [`docs/DEPLOY.md`](docs/DEPLOY.md).

Endpoint `GET /api/health` dipakai healthcheck Docker dan smoke test setelah deploy; endpoint ini satu-satunya rute yang tidak melewati `src/proxy.ts`.

## Halaman

| Kode | Rute | Peran |
| --- | --- | --- |
| P-01 | `/login` | Semua |
| P-02 | `/dashboard` | Owner, Admin, Staf Operasional, Staf Produksi |
| P-03 | `/dashboard/pesanan` | Semua |
| P-04 | `/dashboard/pesanan/baru`, `/dashboard/pesanan/[id]/ubah` | Admin |
| P-05 | `/dashboard/pesanan/[id]` | Semua, isi sesuai hak akses |
| P-06 | `/dashboard/pesanan/[id]/tagihan/baru` | Admin, Staf Operasional |
| P-07 | `/dashboard/pesanan/[id]/pembayaran` | Admin, Staf Operasional |
| P-07b, P-08 | Dialog di P-05 (verifikasi: Admin; koreksi: Admin, Staf Operasional) | |
| P-09 | `/dashboard/jatuh-tempo` | Owner, Admin, Staf Operasional |
| P-10, P-11 | `/dashboard/follow-up`, `/dashboard/follow-up/[idNota]` | Admin |
| P-12, P-13 | `/dashboard/pengiriman/baru`, `/dashboard/pengiriman` | Admin, Staf Pengiriman (Owner melihat) |
| P-14 | `/dashboard/produksi` | Staf Produksi mengubah; Owner, Admin, Staf Operasional melihat |
| P-15 | `/dashboard/pengguna` | Admin |
| P-16, P-17 | `/dashboard/data-master/pelanggan`, `/dashboard/data-master/barang` | Admin mengelola; peran lain melihat |

Hak akses mengikuti matriks PRD bagian 5 (`src/lib/akses.ts`) dan diperiksa di server untuk setiap halaman dan aksi.

## Struktur

```
src/app/(main)/login, ganti-password    halaman tanpa sidebar
src/app/(main)/dashboard/...            halaman aplikasi
src/components/mdp/                     komponen bersama (badge status, tabel, form, kartu)
src/lib/                                format, status, hak akses, konstanta
src/server/db/                          skema Drizzle dan koneksi
src/server/data/                        query baca
src/server/actions/                     Server Actions (simpan, ubah, hapus)
src/server/auth/                        JWT, sesi, login
src/proxy.ts                            perpanjangan access token dari refresh token
scripts/seed.ts                         data uji
```

## Skema basis data

Skema memperluas `ERD Sistem Pengelolaan Transaksi.sql` tanpa mengubah nama dan tipe kolom aslinya. Versi SQL lengkapnya ada di `../ERD Sistem Pengelolaan Transaksi - Diperluas.sql`. Perubahan utama: `faktur.id_pesanan` tidak lagi unik (satu PO boleh punya beberapa nota), ditambah tabel barang, lokasi pengiriman, baris barang PO dan nota, riwayat produksi, tindak lanjut, dan sesi.

## Keputusan tim yang diterapkan

- Status tagihan dihitung dari pembayaran **terverifikasi**. Belum Bayar atau Sebagian yang melewati jatuh tempo menjadi Terlambat. Kelebihan bayar ditampilkan sebagai Lebih Bayar.
- Penanda jatuh tempo: H-3, H-2, dan H-1 kuning, H-0 oranye, Terlambat merah.
- Pembayaran baru berstatus Menunggu Verifikasi. Pembayaran yang ditolak Admin disembunyikan beserta alasannya, tanpa status baru.
- Koreksi status manual wajib beralasan. Koreksi ke Lunas ditolak bila masih ada sisa tanpa pembayaran terverifikasi.
- PO baru berstatus produksi Dalam Proses. Staf Produksi melihat semua PO.
- Status komunikasi tindak lanjut: Dihubungi lewat WhatsApp, Dihubungi lewat telepon, Tidak tersambung, Janji bayar, Sudah bayar (menunggu bukti).
- Setelah PO punya Nota Faktur, barang dan total PO terkunci agar nota tetap cocok.
- Akun baru dan akun yang direset wajib mengganti password sementara saat login.
- Hapus memakai soft delete. Akun tidak dihapus, hanya dinonaktifkan.
