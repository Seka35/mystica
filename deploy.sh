#!/usr/bin/env bash
# ============================================================================
#  Mystica.pro — deploy script (smart + idempotent)
#  Tested on Kali Linux / Debian 12. Run as root:  sudo ./deploy.sh
#
#  Behaviour:
#    • If run inside an existing git checkout (`.git/` present), it just
#      builds and updates the running app — NO git clone.
#    • Otherwise it clones /var/www/mystica from the repo, then proceeds.
#    • Never touches other nginx sites you may have running.
#    • Safe to re-run after every `git pull` (idempotent).
# ============================================================================
set -euo pipefail

DOMAIN="mystica.pro"
WWW_DOMAIN="www.${DOMAIN}"
REPO_URL="git@github.com:Seka35/mystica.git"
DEFAULT_APP_DIR="/var/www/mystica"
NODE_MAJOR="20"
SSH_DIR="/root/.ssh"
DEPLOY_KEY="${SSH_DIR}/mystica_deploy"
CERTBOT_EMAIL="admin@${DOMAIN}"

# ─── Pre-flight ────────────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
  echo "❌  Run as root:  sudo ./deploy.sh"
  exit 1
fi

# Detect "already in a checkout" mode
if [ -d .git ] && [ -f package.json ]; then
  APP_DIR="$(pwd -P)"
  echo "▶  Mystica.pro deploy (in-place mode)"
  echo "   App dir: ${APP_DIR}  (git checkout)"
else
  if [ ! -f "${DEPLOY_KEY}" ]; then
    echo "❌  Missing ${DEPLOY_KEY}"
    echo "    One-time setup on the VPS:"
    echo "      mkdir -p ${SSH_DIR} && chmod 700 ${SSH_DIR}"
    echo "      scp ~/.ssh/mystica_deploy root@<host>:${SSH_DIR}/"
    echo "      chmod 600 ${DEPLOY_KEY}"
    echo
    echo "    Then:"
    echo "      git clone ${REPO_URL} ${DEFAULT_APP_DIR}"
    echo "      cd ${DEFAULT_APP_DIR}"
    echo "      chmod +x deploy.sh && ./deploy.sh"
    exit 1
  fi
  chmod 600 "${DEPLOY_KEY}"
  APP_DIR="${DEFAULT_APP_DIR}"
  echo "▶  Mystica.pro deploy (fresh-VPS mode)"
fi

echo "   Domain:  ${DOMAIN}"
echo

# ─── 1. Node.js ${NODE_MAJOR} ────────────────────────────────────────────────
echo "▶  Checking Node.js ${NODE_MAJOR}..."
if ! command -v node >/dev/null 2>&1 \
   || [ "$(node -v | cut -d. -f1 | tr -d 'v')" != "${NODE_MAJOR}" ]; then
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl gnupg
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null
  apt-get install -y -qq nodejs
fi
echo "   node $(node -v) / npm $(npm -v)"

# ─── 2. nginx + certbot ─────────────────────────────────────────────────────
echo "▶  Checking nginx + certbot..."
if ! command -v nginx >/dev/null 2>&1; then
  apt-get install -y -qq nginx
  systemctl enable nginx >/dev/null
fi
if ! command -v certbot >/dev/null 2>&1; then
  apt-get install -y -qq certbot python3-certbot-nginx
fi
# Don't restart nginx — would disturb other sites. Reload at the end.

# ─── 3. Firewall (open 80 + 443 if not already) ────────────────────────────
echo "▶  Firewall..."
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow 80/tcp  >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
elif command -v iptables >/dev/null 2>&1; then
  iptables -C INPUT -p tcp --dport 80  -j ACCEPT 2>/dev/null \
    || iptables -I INPUT -p tcp --dport 80  -j ACCEPT
  iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null \
    || iptables -I INPUT -p tcp --dport 443 -j ACCEPT
  if command -v netfilter-persistent >/dev/null 2>&1; then
    netfilter-persistent save >/dev/null 2>&1 || true
  fi
fi

# ─── 4. SSH for GitHub (only if we're going to clone) ──────────────────────
if [ ! -d "${APP_DIR}/.git" ]; then
  echo "▶  SSH for GitHub..."
  chmod 700 "${SSH_DIR}" 2>/dev/null || true
  cat > "${SSH_DIR}/config" <<EOF
Host github.com
  HostName github.com
  User git
  IdentityFile ${DEPLOY_KEY}
  StrictHostKeyChecking accept
EOF
  chmod 600 "${SSH_DIR}/config"

  # ─── 5. Clone the repo ───────────────────────────────────────────────────
  echo "▶  Cloning ${REPO_URL} → ${APP_DIR}"
  mkdir -p "$(dirname "${APP_DIR}")"
  rm -rf "${APP_DIR}"
  git clone --depth 1 "${REPO_URL}" "${APP_DIR}"
  cd "${APP_DIR}"
  chmod +x deploy.sh
else
  cd "${APP_DIR}"
  echo "▶  Pulling latest..."
  git pull --ff-only
fi

# ─── 6. .env.local (only if missing) ────────────────────────────────────────
if [ ! -f .env.local ] || grep -q "PLEASE_REPLACE" .env.local 2>/dev/null; then
  echo
  echo "▶  First-run: paste your MINIMAX_API_KEY (starts with 'sk-cp-...' or 'sk-...')"
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
  echo "    Wrote .env.local"
  echo
fi

# ─── 7. Install + build ─────────────────────────────────────────────────────
echo "▶  npm install..."
npm ci --omit=dev 2>/dev/null || npm install --omit=dev

echo "▶  Building Next.js..."
NODE_ENV=production npm run build

# ─── 8. systemd unit (always overwrite — service definition changes) ───────
echo "▶  systemd unit..."
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

# ─── 9. nginx vhost (additive — never touches other sites) ─────────────────
echo "▶  nginx vhost..."
if [ ! -f nginx-mystica.conf ]; then
  echo "❌  nginx-mystica.conf missing in ${APP_DIR}"
  exit 1
fi
ln -sf "${APP_DIR}/nginx-mystica.conf" /etc/nginx/sites-available/mystica
# Remove ONLY nginx's default welcome page, never other sites
rm -f /etc/nginx/sites-enabled/default
# Always include sites-enabled — safe even on minimal configs
grep -q "include /etc/nginx/sites-enabled/\*;" /etc/nginx/nginx.conf \
  || sed -i 's|# include /etc/nginx/sites-enabled/\*;|include /etc/nginx/sites-enabled/*;|' /etc/nginx/nginx.conf

nginx -t && systemctl reload nginx
echo "   nginx config OK, reloaded"

# ─── 10. SSL via certbot ───────────────────────────────────────────────────
if certbot certificates 2>/dev/null | grep -q "${DOMAIN}"; then
  echo "▶  SSL cert already exists for ${DOMAIN}"
else
  echo "▶  Requesting Let's Encrypt cert for ${DOMAIN}..."
  echo "    (DNS A record for ${DOMAIN} → this server must be propagated)"
  if certbot --nginx \
        -d "${DOMAIN}" -d "${WWW_DOMAIN}" \
        --non-interactive --agree-tos -m "${CERTBOT_EMAIL}" \
        --redirect 2>&1 | tee /tmp/certbot.log | tail -3; then
    echo "✅  SSL installed"
  else
    echo "⚠️   SSL request failed (DNS may not be propagated yet)."
    echo "     Retry later: certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN} --redirect"
  fi
fi

# ─── 11. Done ──────────────────────────────────────────────────────────────
sleep 2
echo
echo "▶  Status:"
echo "   mystica:    $(systemctl is-active mystica  2>/dev/null || echo '?')"
echo "   nginx:      $(systemctl is-active nginx    2>/dev/null || echo '?')"
echo
echo "✅  Deploy complete — https://${DOMAIN}"
echo
echo "    journalctl -u mystica -f    # app logs"
echo "    journalctl -u nginx -f      # nginx logs"
echo "    systemctl restart mystica   # quick restart"
echo