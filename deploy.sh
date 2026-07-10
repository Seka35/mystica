#!/usr/bin/env bash
# ============================================================================
#  Mystica.pro — one-shot deploy script
#  Tested on Kali Linux / Debian 12. Run as root:  sudo ./deploy.sh
#
#  What it does:
#    1. Installs Node.js 20, nginx, certbot
#    2. Opens firewall (80, 443)
#    3. Configures SSH so git can clone the repo with the deploy key
#    4. Clones / updates the repo at /var/www/mystica
#    5. Builds the Next.js app
#    6. Configures nginx as a reverse proxy → :3000
#    7. Requests a Let's Encrypt SSL cert (auto-renews)
#    8. Installs a systemd service so the app restarts on crash/reboot
# ============================================================================
set -euo pipefail

DOMAIN="mystica.pro"
WWW_DOMAIN="www.${DOMAIN}"
APP_DIR="/var/www/mystica"
REPO_URL="git@github.com:Seka35/mystica.git"
NODE_MAJOR="20"
SSH_DIR="/root/.ssh"
DEPLOY_KEY="${SSH_DIR}/mystica_deploy"
CERTBOT_EMAIL="admin@${DOMAIN}"
NGINX_CONF_SRC="${APP_DIR}/nginx-mystica.conf"
NGINX_CONF_DST="/etc/nginx/sites-available/mystica"

# ─── Pre-flight ────────────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  echo "❌  Run as root:  sudo ./deploy.sh"
  exit 1
fi

if [ ! -f "${DEPLOY_KEY}" ]; then
  echo "❌  Missing ${DEPLOY_KEY}"
  echo "    From your local machine:"
  echo "      scp ~/.ssh/mystica_deploy root@${DOMAIN}:/root/.ssh/"
  echo "    Then chmod 600 on the server."
  exit 1
fi
chmod 600 "${DEPLOY_KEY}"

echo "▶  Mystica.pro deploy"
echo "   Domain:     ${DOMAIN}"
echo "   App dir:    ${APP_DIR}"
echo "   Repo:       ${REPO_URL}"
echo

# ─── 1. Node.js ${NODE_MAJOR} ────────────────────────────────────────────────
echo "▶  Installing Node.js ${NODE_MAJOR}..."
if ! command -v node >/dev/null 2>&1 \
   || [ "$(node -v | cut -d. -f1 | tr -d 'v')" != "${NODE_MAJOR}" ]; then
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null
  apt-get install -y -qq nodejs
fi
echo "   node $(node -v) / npm $(npm -v)"

# ─── 2. nginx + certbot ─────────────────────────────────────────────────────
echo "▶  Installing nginx + certbot..."
apt-get install -y -qq nginx certbot python3-certbot-nginx
systemctl enable nginx >/dev/null

# ─── 3. Firewall ────────────────────────────────────────────────────────────
echo "▶  Opening firewall ports..."
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow 80/tcp  >/dev/null
  ufw allow 443/tcp >/dev/null
elif command -v iptables >/dev/null 2>&1; then
  iptables -C INPUT -p tcp --dport 80  -j ACCEPT 2>/dev/null \
    || iptables -I INPUT -p tcp --dport 80  -j ACCEPT
  iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null \
    || iptables -I INPUT -p tcp --dport 443 -j ACCEPT
  if command -v netfilter-persistent >/dev/null 2>&1; then
    netfilter-persistent save >/dev/null 2>&1 || true
  fi
fi

# ─── 4. SSH for GitHub ──────────────────────────────────────────────────────
echo "▶  Configuring SSH for GitHub..."
chmod 700 "${SSH_DIR}"
cat > "${SSH_DIR}/config" <<EOF
Host github.com
  HostName github.com
  User git
  IdentityFile ${DEPLOY_KEY}
  StrictHostKeyChecking accept
EOF
chmod 600 "${SSH_DIR}/config"

# ─── 5. Clone / update repo ────────────────────────────────────────────────
echo "▶  Cloning repository..."
mkdir -p "$(dirname "${APP_DIR}")"
if [ -d "${APP_DIR}/.git" ]; then
  cd "${APP_DIR}"
  git fetch --all --prune
  git reset --hard origin/main
else
  rm -rf "${APP_DIR}"
  git clone --depth 1 "${REPO_URL}" "${APP_DIR}"
fi
cd "${APP_DIR}"
chmod +x deploy.sh

# ─── 6. .env.local (interactive on first run only) ──────────────────────────
if [ ! -f .env.local ] || grep -q "PLEASE_REPLACE" .env.local 2>/dev/null; then
  echo
  echo "▶  First-run setup: .env.local"
  echo "    Paste your MINIMAX_API_KEY (starts with 'sk-cp-...' or 'sk-...')."
  echo
  read -r -p "    MINIMAX_API_KEY = " KEY
  if [ -z "${KEY}" ]; then
    echo "❌  Empty key, aborting."
    exit 1
  fi
  cat > .env.local <<EOF
MINIMAX_API_KEY=${KEY}
ANTHROPIC_BASE_URL=https://api.minimax.io/anthropic
EOF
  echo "    Wrote $(pwd)/.env.local"
  echo
fi

# ─── 7. Install + build ─────────────────────────────────────────────────────
echo "▶  Installing npm deps..."
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

echo "▶  Building production bundle..."
NODE_ENV=production npm run build

# ─── 8. systemd service ─────────────────────────────────────────────────────
echo "▶  Creating systemd unit (mystica.service)..."
cat > /etc/systemd/system/mystica.service <<EOF
[Unit]
Description=Mystica.pro — Next.js Tarot App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable mystica >/dev/null
systemctl restart mystica

# ─── 9. nginx reverse proxy ────────────────────────────────────────────────
echo "▶  Configuring nginx..."
if [ ! -f "${NGINX_CONF_SRC}" ]; then
  echo "❌  ${NGINX_CONF_SRC} not found. Was the repo fully cloned?"
  exit 1
fi

# Enable our config, disable default site
ln -sf "${NGINX_CONF_SRC}" "${NGINX_CONF_DST}"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# ─── 10. SSL via certbot ───────────────────────────────────────────────────
echo "▶  Requesting Let's Encrypt SSL certificate..."
echo "    (requires DNS A record for ${DOMAIN} → this server to be propagated)"
if certbot --nginx \
      -d "${DOMAIN}" -d "${WWW_DOMAIN}" \
      --non-interactive --agree-tos -m "${CERTBOT_EMAIL}" \
      --redirect; then
  echo "✅  SSL certificate installed and HTTP→HTTPS redirect enabled"
else
  echo "⚠️   SSL request failed (DNS may not have propagated yet)."
  echo "     The site is reachable on HTTP only for now."
  echo "     Re-run later with:"
  echo "       certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN} --redirect"
fi

# ─── 11. Done ──────────────────────────────────────────────────────────────
sleep 2
echo
echo "▶  Status:"
echo "   mystica:    $(systemctl is-active mystica  2>/dev/null || echo '?')"
echo "   nginx:      $(systemctl is-active nginx    2>/dev/null || echo '?')"
echo
echo "✅  Deploy complete."
echo
echo "   🌐  https://${DOMAIN}"
echo
echo "   Useful:"
echo "     journalctl -u mystica -f           # live app logs"
echo "     journalctl -u nginx -f             # live nginx logs"
echo "     systemctl restart mystica          # restart app"
echo "     sudo ./deploy.sh                   # redeploy (git pull + rebuild)"
echo