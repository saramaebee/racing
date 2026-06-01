#!/usr/bin/env bash
# racing install script — run on the GCE VM (same box as atmosfera is fine).
# Installs Bun if missing, clones/updates the repo, and registers a systemd
# unit that runs the Bun server. Idempotent: safe to re-run.
#
#   curl -fsSL https://raw.githubusercontent.com/<you>/racing/main/deploy/install.sh | bash

set -euo pipefail

REPO_URL=${REPO_URL:-https://github.com/saramaebee/racing.git}
INSTALL_DIR=${INSTALL_DIR:-$HOME/racing}
SERVICE_NAME=racing
DEPLOY_USER=${DEPLOY_USER:-$USER}
WEB_PORT=${WEB_PORT:-3000}

if [ "$DEPLOY_USER" != "$USER" ]; then
  echo "ERROR: DEPLOY_USER=$DEPLOY_USER but you're running as $USER. Re-run as $DEPLOY_USER." >&2
  exit 1
fi

echo "==> Installing Bun if needed"
if [ ! -x "$HOME/.bun/bin/bun" ]; then
  curl -fsSL https://bun.sh/install | bash
fi
BUN="$HOME/.bun/bin/bun"

echo "==> Cloning / updating repo at $INSTALL_DIR"
if [ ! -d "$INSTALL_DIR/.git" ]; then
  git clone "$REPO_URL" "$INSTALL_DIR"
else
  git -C "$INSTALL_DIR" fetch origin
  git -C "$INSTALL_DIR" reset --hard origin/main
fi

echo "==> Installing dependencies"
(cd "$INSTALL_DIR" && "$BUN" install --production)

if [ ! -f "$INSTALL_DIR/.env" ]; then
  echo "==> Writing starter .env (EDIT THESE VALUES)"
  cat > "$INSTALL_DIR/.env" <<EOF
PORT=$WEB_PORT
EDIT_PASSWORD=changeme
SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || echo please-change-me)
DATABASE_PATH=./data/racing.db
EOF
fi

echo "==> Writing systemd unit /etc/systemd/system/${SERVICE_NAME}.service"
sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=racing championship tracker
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=$BUN src/index.tsx
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "==> Granting passwordless restart/status/stop sudo to $DEPLOY_USER (for CI/CD)"
sudo tee /etc/sudoers.d/${SERVICE_NAME} > /dev/null <<EOF
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart ${SERVICE_NAME}
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl status ${SERVICE_NAME}
$DEPLOY_USER ALL=(ALL) NOPASSWD: /bin/systemctl stop ${SERVICE_NAME}
EOF
sudo chmod 0440 /etc/sudoers.d/${SERVICE_NAME}

echo "==> Enabling + starting service"
sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}
sudo systemctl restart ${SERVICE_NAME}

cat <<EOF

==> racing install complete.

Next steps:
  1. Edit $INSTALL_DIR/.env — set a real EDIT_PASSWORD.
  2. Point DNS: A record  racing.saratonin.dev -> this VM's public IP.
  3. Add a Caddy site block (then 'sudo systemctl reload caddy'):

       racing.saratonin.dev {
         reverse_proxy localhost:${WEB_PORT}
       }

  4. Check it:  journalctl -u ${SERVICE_NAME} -f
EOF
