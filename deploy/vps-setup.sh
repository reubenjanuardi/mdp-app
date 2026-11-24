#!/usr/bin/env bash
# Bootstrap stack mdp-app di VPS yang sudah berjalan (Docker + Cloudflare Tunnel aktif).
# Jalankan sekali sebagai root, dari akar repositori:
#   git clone https://github.com/reubenjanuardi/mdp-app.git /root/mdp-setup && cd /root/mdp-setup
#   DOMAIN=mdp.namadomain.com bash deploy/vps-setup.sh
# Skrip ini idempoten: aman dijalankan ulang, dan tidak menyentuh stack lain di VPS ini.
set -euo pipefail

APP_DIR="/opt/stacks/mdp-app"
DOMAIN="${DOMAIN:-mdp.namadomain.com}"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "== 1/4 Cek prasyarat VPS =="
command -v docker >/dev/null 2>&1 || { echo "Docker belum terpasang di VPS ini."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Plugin docker compose belum ada."; exit 1; }
docker network inspect hosiana_network >/dev/null 2>&1 || {
  echo "Network hosiana_network tidak ditemukan. Buat dulu: docker network create hosiana_network"
  exit 1
}
if ! docker ps --format '{{.Names}}' | grep -qx cloudflared-tunnel; then
  echo "PERINGATAN: container cloudflared-tunnel tidak berjalan; trafik publik belum bisa masuk."
fi

echo "== 2/4 Siapkan $APP_DIR =="
mkdir -p "$APP_DIR"
cp -f "$SRC_DIR/docker-compose.prod.yml" "$APP_DIR/docker-compose.prod.yml"
cp -f "$SRC_DIR/.env.production.example" "$APP_DIR/.env.production.example"
cd "$APP_DIR"

echo "== 3/4 Buat .env berisi rahasia acak =="
if [ ! -f .env ]; then
  cp .env.production.example .env
  PG_PASS=$(openssl rand -hex 24)
  ACCESS=$(openssl rand -base64 48 | tr -d '\n=+/')
  REFRESH=$(openssl rand -base64 48 | tr -d '\n=+/')
  sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${PG_PASS}|" .env
  sed -i "s|^JWT_ACCESS_SECRET=.*|JWT_ACCESS_SECRET=${ACCESS}|" .env
  sed -i "s|^JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=${REFRESH}|" .env
  sed -i "s|^NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://${DOMAIN}|" .env
  chmod 600 .env
  echo "   .env dibuat. Periksa isinya: nano ${APP_DIR}/.env"
else
  echo "   .env sudah ada, dilewati."
fi

echo "== 4/4 Verifikasi konfigurasi compose =="
docker compose -f docker-compose.prod.yml config -q && echo "   compose valid."

cat <<EOF

Selesai. Langkah berikutnya:
  1. Daftarkan public hostname di Cloudflare Zero Trust > Networks > Tunnels > (tunnel VPS ini)
     > Public Hostname:
        Subdomain/domain : ${DOMAIN}
        Service          : http://mdp-app:3000
     Tidak perlu port di host, tidak perlu Nginx/certbot: TLS diurus Cloudflare.
  2. Isi secrets di GitHub repo (Settings > Secrets and variables > Actions):
        VPS_HOST    = IP VPS ini
        VPS_USER    = root
        VPS_SSH_KEY = private key yang public-nya sudah ada di ~/.ssh/authorized_keys VPS
     dan variable:
        APP_URL     = https://${DOMAIN}
  3. Jalankan deploy: Actions > "Deploy ke VPS" > Run workflow.
  4. Verifikasi:  curl https://${DOMAIN}/api/health
EOF
