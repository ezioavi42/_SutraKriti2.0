#!/usr/bin/env bash
# SutraKriti — one-shot local development setup.
# Verified on Debian/Ubuntu and macOS. Windows users: run inside WSL2.
#
# What this does:
#   1. Installs MariaDB (if missing)
#   2. Ensures the MariaDB service is running
#   3. Creates the database and dedicated MySQL user
#   4. Copies .env.example → .env (only if .env does not already exist)
#   5. Installs Node dependencies (yarn)
#   6. Runs the schema bootstrapper (scripts/init-db.js)
#
# Usage:
#   bash scripts/setup-local.sh
set -euo pipefail

BLUE='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log() { echo -e "${BLUE}•${NC} $*"; }
ok()  { echo -e "${GREEN}✓${NC} $*"; }
warn(){ echo -e "${YELLOW}!${NC} $*"; }

OS="$(uname -s)"

# --- 1. MariaDB --------------------------------------------------------
if ! command -v mysql >/dev/null 2>&1 && ! command -v mariadb >/dev/null 2>&1; then
  log "Installing MariaDB …"
  if [[ "$OS" == "Linux" ]]; then
    sudo apt-get update -y && sudo apt-get install -y mariadb-server
  elif [[ "$OS" == "Darwin" ]]; then
    brew install mariadb && brew services start mariadb
  else
    warn "Unsupported OS ($OS). Please install MariaDB manually and re-run."
    exit 1
  fi
else
  ok "MariaDB / MySQL already installed."
fi

# --- 2. Service --------------------------------------------------------
if [[ "$OS" == "Linux" ]]; then
  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl enable --now mariadb 2>/dev/null || sudo service mariadb start 2>/dev/null || true
  else
    # container without systemd — launch mariadbd directly
    if ! pgrep -x mariadbd >/dev/null 2>&1; then
      sudo mariadbd --user=mysql --datadir=/var/lib/mysql --bind-address=127.0.0.1 --port=3306 > /tmp/mariadb.log 2>&1 &
      sleep 4
    fi
  fi
fi
ok "MariaDB is running."

# --- 3. Database + user -----------------------------------------------
log "Creating database and user …"
sudo mysql -uroot <<'SQL'
CREATE DATABASE IF NOT EXISTS sutrakriti CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sutrakriti'@'localhost' IDENTIFIED BY 'sutrakriti_dev_pw';
CREATE USER IF NOT EXISTS 'sutrakriti'@'127.0.0.1' IDENTIFIED BY 'sutrakriti_dev_pw';
GRANT ALL PRIVILEGES ON sutrakriti.* TO 'sutrakriti'@'localhost';
GRANT ALL PRIVILEGES ON sutrakriti.* TO 'sutrakriti'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL
ok "Database 'sutrakriti' + user 'sutrakriti' ready."

# --- 4. .env -----------------------------------------------------------
if [[ ! -f .env ]]; then
  cp .env.example .env
  ok "Copied .env.example → .env  (edit as needed)"
else
  warn ".env already exists — leaving it untouched."
fi

# --- 5. Node deps ------------------------------------------------------
if command -v yarn >/dev/null 2>&1; then
  log "Installing dependencies with yarn …"
  yarn install --frozen-lockfile
else
  log "Yarn not found, falling back to npm ci …"
  npm ci
fi
ok "Dependencies installed."

# --- 6. Schema ---------------------------------------------------------
log "Bootstrapping MySQL schema …"
node scripts/init-db.js
ok "Schema ready. Run  yarn dev  to start the server on http://localhost:3000"
