# Rencana Deploy ke VPS + CI/CD GitHub Actions

Aplikasi MDP dijalankan sebagai stack Docker Compose di **VPS yang sama** dengan
portal-aplikasi-gereja, dan diekspos lewat **Cloudflare Tunnel** yang sudah ada di sana.
Tidak ada Nginx vhost baru, tidak ada certbot, tidak ada port yang dibuka di host.

## 1. Arsitektur

```
Developer push ke main
        │
        ▼
┌──────────────────────────── GitHub Actions ────────────────────────────┐
│ 1. quality  : npm ci -> tsc --noEmit -> npm test                       │
│ 2. build    : docker build --target runner   -> ghcr.io/.../mdp-app:latest
│                                              -> ghcr.io/.../mdp-app:sha-<commit>
│               docker build --target migrator -> ghcr.io/.../mdp-app:migrate
│ 3. deploy   : scp docker-compose.prod.yml -> SSH ke VPS                │
│               docker login ghcr.io                                     │
│               docker compose pull                                      │
│               docker compose run --rm migrate  (drizzle-kit migrate)   │
│               docker compose up -d  -> healthcheck /api/health         │
└────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────── VPS 103.42.245.209 ───────────────────────────┐
│                                                                           │
│  Internet ──► Cloudflare (TLS, domain) ──► cloudflared-tunnel             │
│                                            (network: hosiana_network)     │
│                                                    │                      │
│                                                    ▼ http://mdp-app:3000  │
│                                          container "mdp-app" (Next.js)    │
│                                                    │                      │
│                                                    ▼ postgres://db:5432   │
│                                          container "mdp-db" (Postgres 17) │
│                                                    │                      │
│                                     volume mdp-pgdata + mdp-uploads       │
│                                                                           │
│  stack lain di VPS ini (tidak disentuh):                                  │
│    cloudflared-tunnel, keuangan-gereja-app, web-placeholder,              │
│    hermes, 9router, portainer                                             │
└───────────────────────────────────────────────────────────────────────────┘
```

Kenapa begini:

- VPS ini sudah memakai Cloudflare Tunnel; menambah Nginx + certbot hanya menambah bagian yang
  bisa rusak dan bentrok dengan stack lain.
- `mdp-app` cukup ikut network `hosiana_network`, sama seperti `keuangan-gereja-app`, lalu
  didaftarkan sebagai public hostname di dashboard Cloudflare.
- Build tetap di CI (bukan di VPS) karena RAM VPS dipakai bersama 6 container lain.

## 2. Berkas yang dipakai

| Berkas | Fungsi |
| --- | --- |
| `Dockerfile` | Multi-stage: `deps` → `builder` → `runner` (Next.js standalone) dan `migrator` (job migrasi Drizzle) |
| `.dockerignore` | Menjaga konteks build kecil (tanpa `node_modules`, `.next`, `.git`, `storage`) |
| `docker-compose.prod.yml` | `app` + `db` + job `migrate`, ikut network `hosiana_network`, tanpa port host |
| `.env.production.example` | Template `.env` untuk `/opt/stacks/mdp-app` |
| `.github/workflows/deploy.yml` | CI/CD: lint/tipe/tes, build, push GHCR, deploy via SSH |
| `deploy/vps-setup.sh` | Bootstrap sekali jalan: cek prasyarat, buat `/opt/stacks/mdp-app`, isi `.env` |
| `src/app/api/health/route.ts` | Endpoint `/api/health` untuk healthcheck Docker dan smoke test |
| `next.config.mjs` | Ditambah `output: "standalone"` |
| `src/proxy.ts` | Matcher dikecualikan untuk `/api/health` agar healthcheck tidak di-redirect ke `/login` |

## 3. Prasyarat yang sudah ada di VPS

Sudah terpasang dan dipakai stack lain, jadi tidak perlu diapa-apakan:

- Docker Engine + Docker Compose v5 (`docker compose version`).
- Network docker `hosiana_network` (berisi `cloudflared-tunnel`, `keuangan-gereja-app`, `web-placeholder`).
- Cloudflare Tunnel aktif dengan token (`cloudflared-tunnel`, restart `unless-stopped`).
- Pola folder stack: `/opt/stacks/<nama-project>/docker-compose.yml` + `.env`.
- Port host 3000 dan 5432 kosong — tetapi stack ini memang tidak memakainya.

Kapasitas saat ini: RAM 3,9 GB (≈2,3 GB tersedia), disk 38 GB (≈21 GB bebas). Cukup untuk
`mdp-app` (~150–250 MB RAM) + `mdp-db` (~50–100 MB RAM).

## 4. Persiapan (sekali saja)

```bash
ssh root@103.42.245.209
apt-get install -y git        # kalau belum ada
git clone https://github.com/reubenjanuardi/mdp-app.git /root/mdp-setup
cd /root/mdp-setup
DOMAIN=mdp.namadomain.com bash deploy/vps-setup.sh
```

Skrip itu: mengecek Docker/network/tunnel, membuat `/opt/stacks/mdp-app`, menyalin compose +
template `.env`, lalu mengisi `POSTGRES_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
dengan nilai acak dan `NEXT_PUBLIC_APP_URL` sesuai `DOMAIN`.

Lalu daftarkan domain di Cloudflare:

**Zero Trust → Networks → Tunnels → (tunnel VPS ini) → Public Hostname → Add**

| Field | Isi |
| --- | --- |
| Subdomain | `mdp` |
| Domain | `namadomain.com` |
| Service | `http://mdp-app:3000` |

Setelah itu `https://mdp.namadomain.com` langsung mengarah ke container aplikasi; TLS diurus
Cloudflare, dan DNS record-nya dibuat otomatis oleh tunnel.

Catatan `.env`:

- `POSTGRES_PASSWORD` sebaiknya hanya huruf/angka (dipakai di dalam URL `DATABASE_URL`).
- `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` minimal 32 karakter; kalau diganti, semua sesi
  pengguna tidak berlaku (harus login ulang).
- `NEXT_PUBLIC_APP_URL` harus `https://...` tanpa garis miring di akhir, dan harus sama dengan
  public hostname di Cloudflare.
- `DATABASE_URL` tidak perlu diisi; compose menyusunnya sendiri dengan host `db`.

## 5. Secrets & variables di GitHub

**Settings → Secrets and variables → Actions**

| Tipe | Nama | Isi |
| --- | --- | --- |
| Secret | `VPS_HOST` | `103.42.245.209` |
| Secret | `VPS_USER` | `root` |
| Secret | `VPS_SSH_KEY` | private key yang public-nya ada di `~/.ssh/authorized_keys` VPS |
| Secret | `VPS_PORT` | opsional, default 22 |
| Variable | `APP_URL` | `https://mdp.namadomain.com` (build arg `NEXT_PUBLIC_APP_URL` + URL environment) |

Key yang sudah ada di laptop untuk VPS ini (`~/.ssh/hosifest_vps`) boleh dipakai ulang — VPS-nya
memang sama. Kalau mau dipisah per project, buat key baru:

```bash
ssh-keygen -t ed25519 -C "github-actions-mdp" -f ~/.ssh/mdp_vps -N ""
ssh-copy-id -i ~/.ssh/mdp_vps.pub root@103.42.245.209
cat ~/.ssh/mdp_vps      # tempel ke secret VPS_SSH_KEY
```

Izin paket GHCR: `GITHUB_TOKEN` pada workflow sudah punya `packages: write`, jadi tidak perlu PAT
untuk deploy. PAT hanya perlu kalau mau `docker pull` manual di VPS:

```bash
echo <PAT_classic_read:packages> | docker login ghcr.io -u <username-github> --password-stdin
```

## 6. Alur CI/CD yang berjalan

Setiap push ke `main` (kecuali perubahan hanya di `*.md`/`docs/**`):

1. **quality** — `npm ci`, `npx tsc --noEmit`, `npm test`.
   `npm run check` (Biome) ikut dijalankan tetapi `continue-on-error` karena kode yang ada
   menyisakan temuan lama (`noNestedTernary`, `noArrayIndexKey`, dan sejenisnya). Hapus
   `continue-on-error` begitu `npm run check` bersih.
2. **build** — dua image dari `Dockerfile`:
   - `runner` → `ghcr.io/reubenjanuardi/mdp-app:latest` dan `:sha-<commit-penuh>`
   - `migrator` → `ghcr.io/reubenjanuardi/mdp-app:migrate`
3. **deploy** — menyalin `docker-compose.prod.yml` + `.env.production.example` ke
   `/opt/stacks/mdp-app`, lalu lewat SSH:
   ```bash
   docker login ghcr.io
   docker compose --profile tools pull app migrate
   docker compose --profile tools run --rm migrate
   docker compose up -d --remove-orphans
   docker compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/health')..."  # ulang 30x
   # tag sha yang berjalan ditulis ke .env, lalu docker image prune -f
   ```
   Healthcheck dijalankan **di dalam container** karena tidak ada port yang dibuka di host.

`concurrency: deploy-produksi` mencegah dua deploy berjalan bersamaan.

Deploy tanpa commit baru: **Actions → Deploy ke VPS → Run workflow**.

## 7. Deploy pertama

```bash
# di VPS, setelah .env ada dan domain terdaftar di Cloudflare
cd /opt/stacks/mdp-app
echo <PAT_read_packages> | docker login ghcr.io -u <username> --password-stdin
docker compose -f docker-compose.prod.yml --profile tools pull app migrate
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
curl https://mdp.namadomain.com/api/health
```

Atau langsung lewat Actions (lebih ringkas, asal secrets sudah diisi): Run workflow → job deploy
melakukan hal yang sama.

Opsional, hanya untuk demo/sidang — isi data uji. Cara paling aman: jalankan dari dalam network
stack, jangan buka port Postgres ke host.

```bash
cd /root/mdp-setup && npm ci
docker run --rm --network mdp-app_internal \
  -v "$PWD:/app" -w /app -e DATABASE_URL="postgres://mdp:<POSTGRES_PASSWORD>@mdp-db:5432/mdp" \
  node:22-alpine sh -c "npm run db:seed"
```

**Jangan** seed kalau DB sudah berisi data asli — seed menghapus data lama.

## 8. Rollback

Setiap commit menghasilkan tag `sha-<commit>`. Rollback = pin ke tag lama:

```bash
cd /opt/stacks/mdp-app
docker image ls ghcr.io/reubenjanuardi/mdp-app

MDP_IMAGE=ghcr.io/reubenjanuardi/mdp-app:sha-<commit-lama> \
  docker compose -f docker-compose.prod.yml up -d app
```

Workflow juga menulis tag `sha-<commit>` yang sedang berjalan ke `.env` setelah healthcheck lolos,
jadi `docker compose ps` selalu menunjukkan versi yang benar. Migrasi bersifat maju saja: kalau
rollback melewati perubahan skema, siapkan migrasi balik manual.

## 9. Operasional harian

| Kebutuhan | Perintah |
| --- | --- |
| Status container | `cd /opt/stacks/mdp-app && docker compose -f docker-compose.prod.yml ps` |
| Log aplikasi | `docker compose -f docker-compose.prod.yml logs -f --tail=200 app` |
| Restart aplikasi | `docker compose -f docker-compose.prod.yml restart app` |
| Migrasi manual | `docker compose -f docker-compose.prod.yml --profile tools run --rm migrate` |
| Masuk ke Postgres | `docker compose -f docker-compose.prod.yml exec db psql -U mdp -d mdp` |
| Cek semua stack di VPS | `docker ps --format '{{.Names}}\t{{.Status}}'` |
| Bersihkan image lama | `docker image prune -f` |

Backup harian (cron di VPS, simpan 7 hari, tidak menyentuh stack lain):

```bash
mkdir -p /opt/stacks/mdp-app/backups
cat >/etc/cron.daily/mdp-backup <<'EOF'
#!/bin/sh
set -e
cd /opt/stacks/mdp-app
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U mdp -d mdp \
  | gzip > backups/mdp-$(date +%F).sql.gz
find backups -name 'mdp-*.sql.gz' -mtime +7 -delete
EOF
chmod +x /etc/cron.daily/mdp-backup
```

Restore:

```bash
gunzip -c /opt/stacks/mdp-app/backups/mdp-2026-01-01.sql.gz \
  | docker compose -f docker-compose.prod.yml exec -T db psql -U mdp -d mdp
```

## 10. Hal yang mudah bikin gagal

1. **Cookie `secure` butuh HTTPS.** `opsiCookie` menyetel `secure: true` saat
   `NODE_ENV=production`, jadi login tidak jalan lewat `http://IP_VPS:3000`. Akses selalu lewat
   domain Cloudflare.
2. **Public hostname harus `http://mdp-app:3000`**, bukan `localhost:3000` — cloudflared
   menjangkau container lewat DNS docker di `hosiana_network`.
3. **`NEXT_PUBLIC_APP_URL` di-*bake* saat build.** Ganti domain berarti build ulang image
   (jalankan ulang workflow), bukan cuma ubah `.env`.
4. **Unggahan ada di volume `mdp-uploads`.** Jangan `docker compose down -v` (menghapus volume).
   Aplikasi hanya boleh 1 replika karena berkas disimpan di disk container.
5. **Jangan pakai `docker system prune -a --volumes` di VPS ini** — bisa menghapus image/volume
   stack gereja, hermes, portainer, dan 9router.
6. **Build gagal di `node:22-alpine`** (jarang, terkait binari native musl): ganti ketiga baris
   `FROM node:22-alpine` menjadi `FROM node:22-slim` di `Dockerfile`.
7. **`npm ci` gagal** berarti `package-lock.json` tidak sinkron dengan `package.json`; jalankan
   `npm install` lalu commit lock baru.
8. **Batas unggah tiga lapis:** 5 MB di aplikasi (`BATAS_UNGGAH`), 6 MB di Server Action.
   Cloudflare punya batas body sendiri (100 MB di plan gratis), jadi tidak jadi kendala.

## 11. Kalau ingin memakai Docker Hub

Ubah di `deploy.yml`:

- `env.REGISTRY: docker.io`, `env.IMAGE_NAME: <user-dockerhub>/mdp-app`
- login: `username: ${{ secrets.DOCKERHUB_USERNAME }}`, `password: ${{ secrets.DOCKERHUB_TOKEN }}`
- di VPS, ganti `MDP_IMAGE`/`MDP_MIGRATE_IMAGE` pada `.env` dan login dengan `docker login`.

## 12. Checklist go-live

- [ ] `deploy/vps-setup.sh` sudah dijalankan; `/opt/stacks/mdp-app/.env` berisi rahasia acak
      (bukan nilai contoh) dan `NEXT_PUBLIC_APP_URL` sesuai domain
- [ ] Public hostname `mdp.namadomain.com` → `http://mdp-app:3000` terdaftar di tunnel Cloudflare
- [ ] Secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` dan variable `APP_URL` terisi di repo
- [ ] Workflow `Deploy ke VPS` hijau
- [ ] `curl https://mdp.namadomain.com/api/health` → `{"status":"ok","basisData":"ok"}`
- [ ] Login akun Admin berhasil, ganti password sementara
- [ ] Unggah bukti pembayaran 3 MB berhasil, dan masih bisa dibuka setelah `restart app`
- [ ] Stack lain tetap hidup: `docker ps` masih menampilkan `keuangan-gereja-app`,
      `cloudflared-tunnel`, `hermes`, `9router`, `portainer`
- [ ] Backup harian terbentuk di `/opt/stacks/mdp-app/backups`
