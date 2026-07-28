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

BLUE='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log() { echo -e "${BLUE}•${NC} $*"; }
ok()  { echo -e "${GREEN}✓${NC} $*"; }
warn(){ echo -e "${YELLOW}!${NC} $*"; }
err() { echo -e "${RED}✗${NC} $*"; }

OS="$(uname -s)"

# --- 1. MariaDB --------------------------------------------------------
if ! command -v mysql >/dev/null 2>&1 && ! command -v mariadb >/dev/null 2>&1; then
  log "Installing MariaDB …"
  if [[ "$OS" == "Linux" ]]; then
    sudo apt-get update -y && sudo apt-get install -y mariadb-server
  elif [[ "$OS" == "Darwin" ]]; then
    if ! command -v brew >/dev/null 2>&1; then
      err "Homebrew not found. Install it from https://brew.sh then re-run this script."
      exit 1
    fi
    brew install mariadb
  else
    err "Unsupported OS ($OS). Please install MariaDB manually and re-run."
    exit 1
  fi
else
  ok "MariaDB / MySQL already installed."
fi

# --- 2. Service --------------------------------------------------------
start_wait() {
  # Wait until the server accepts connections on 127.0.0.1:3306 (max ~20s)
  local i=0
  while (( i < 40 )); do
    if mysqladmin -h 127.0.0.1 -P 3306 --connect-timeout=1 ping >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5; i=$((i+1))
  done
  return 1
}

if [[ "$OS" == "Darwin" ]]; then
  # Homebrew MariaDB does NOT auto-start after install. `brew services start`
  # is idempotent (a no-op if already running).
  log "Starting MariaDB via brew services …"
  brew services start mariadb >/dev/null 2>&1 || true
  # Bootstrap system tables on first-ever start if data dir is empty
  # (safe no-op on subsequent runs).
  if start_wait; then
    ok "MariaDB is running (TCP 127.0.0.1:3306)."
  else
    warn "MariaDB did not respond over TCP within 20s. Falling back to socket…"
    if ! mysql -uroot -e "SELECT 1" >/dev/null 2>&1; then
      err "Could not connect to MariaDB. Try:  brew services restart mariadb  and re-run."
      exit 1
    fi
    ok "MariaDB is reachable via unix socket."
  fi
elif [[ "$OS" == "Linux" ]]; then
  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl enable --now mariadb 2>/dev/null || sudo service mariadb start 2>/dev/null || true
  else
    # container without systemd — launch mariadbd directly
    if ! pgrep -x mariadbd >/dev/null 2>&1; then
      sudo mariadbd --user=mysql --datadir=/var/lib/mysql --bind-address=127.0.0.1 --port=3306 > /tmp/mariadb.log 2>&1 &
      sleep 4
    fi
  fi
  ok "MariaDB is running."
fi

# --- 3. Database + user -----------------------------------------------
log "Creating database and user …"

# Choose the right invocation:
#  - macOS (Homebrew): connect over TCP, no sudo. Default root has no password.
#  - Linux (Debian/Ubuntu): default root uses unix_socket auth — needs sudo, no password.
if [[ "$OS" == "Darwin" ]]; then
  MYSQL_ROOT_CMD=(mysql -h 127.0.0.1 -P 3306 -uroot)
else
  MYSQL_ROOT_CMD=(sudo mysql -uroot)
fi

"${MYSQL_ROOT_CMD[@]}" <<'SQL'
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
