# Running SutraKriti on your local machine

This guide gets the full SutraKriti stack (Next.js + MySQL + optional SMTP)
running on your laptop for development.

> **TL;DR** (Debian/Ubuntu/macOS):
> ```bash
> git clone <repo> sutrakriti && cd sutrakriti
> bash scripts/setup-local.sh
> yarn dev
> ```
> Open <http://localhost:3000> 🎉

---

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 18.x or 20.x | `node -v` |
| Yarn | 1.22+ | `npm install -g yarn` (or use npm/pnpm) |
| MariaDB / MySQL | 10.5+ / 8.0+ | Local server on 127.0.0.1:3306 |
| Git | any | — |

### Install MariaDB

**Debian / Ubuntu**
```bash
sudo apt-get update && sudo apt-get install -y mariadb-server
sudo systemctl enable --now mariadb          # or: sudo service mariadb start
```

**macOS (Homebrew)**
```bash
brew install mariadb
brew services start mariadb
```

**Windows**
- Use **WSL2** (Ubuntu) and follow the Debian steps above — recommended.
- Or install [MariaDB Windows MSI](https://mariadb.org/download/) and use MySQL Workbench.

### Verify MariaDB is running
```bash
sudo mysql -uroot -e "SELECT VERSION();"
```

---

## 2. Clone the repo

```bash
git clone <your-repo-url> sutrakriti
cd sutrakriti
```

---

## 3. One-shot setup script (recommended)

```bash
bash scripts/setup-local.sh
```

What it does (idempotent — safe to re-run):
1. Ensures MariaDB is installed & running.
2. Creates the `sutrakriti` database + a dedicated user (`sutrakriti` / `sutrakriti_dev_pw`).
3. Copies `.env.example` → `.env` (only if `.env` doesn’t exist).
4. Installs Node dependencies via yarn (npm fallback).
5. Runs `node scripts/init-db.js` to create all tables.

---

## 4. Manual setup (if you prefer)

### 4.1 Create the database & user

**macOS (Homebrew)** — no `sudo` needed (MariaDB runs under your user):
```bash
mysql -uroot <<SQL
CREATE DATABASE IF NOT EXISTS sutrakriti
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sutrakriti'@'localhost'
  IDENTIFIED BY 'sutrakriti_dev_pw';
GRANT ALL PRIVILEGES ON sutrakriti.* TO 'sutrakriti'@'localhost';
FLUSH PRIVILEGES;
SQL
```

**Linux (Debian/Ubuntu)** — the default install uses `unix_socket` auth for root, so use `sudo`:
```bash
sudo mysql -uroot <<SQL
CREATE DATABASE IF NOT EXISTS sutrakriti
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sutrakriti'@'localhost'
  IDENTIFIED BY 'sutrakriti_dev_pw';
GRANT ALL PRIVILEGES ON sutrakriti.* TO 'sutrakriti'@'localhost';
FLUSH PRIVILEGES;
SQL
```

### 4.2 Configure environment
```bash
cp .env.example .env
# open .env in your editor and tweak values if needed
```

Minimal set for localhost:
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
MYSQL_HOST=127.0.0.1
MYSQL_USER=sutrakriti
MYSQL_PASSWORD=sutrakriti_dev_pw
MYSQL_DATABASE=sutrakriti
WHATSAPP_NUMBER=917777932385
UPLOAD_TOKEN=sutrakriti-dev-upload-token
NEXT_PUBLIC_BUY_NOW_ENABLED=false
ADMIN_PASSWORD=change-me-strong-password
ADMIN_SESSION_SECRET=change-me-random-long-string
```

### 4.3 Access the admin dashboard
After the app is running, open `http://localhost:3000/admin` and sign in with the password from `ADMIN_PASSWORD`.

- The login endpoint is `/api/admin/login` and it sets the `sk_admin` cookie for the dashboard.
- For a production-style test, you can also set the same `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` values in the MilesWeb cPanel Node.js App environment variables and restart the app.

### 4.4 Install & bootstrap
```bash
yarn install
node scripts/init-db.js       # creates all tables
```

---

## 5. Run the dev server

```bash
yarn dev                       # http://localhost:3000
```

Hot-reload is enabled. Any change under `app/`, `components/`, `lib/` or `public/`
is reflected on save.

---

## 6. Verify everything works

```bash
curl -s http://localhost:3000/api/health
# → {"ok":true,"db":true,"mail":false}

curl -s http://localhost:3000/api/products | jq '.products|length'
# → 8

curl -s -X POST http://localhost:3000/api/custom-order \
  -H 'Content-Type: application/json' \
  -d '{"name":"You","contact":"+911111111111","notes":"hello!"}'
# → {"ok":true,"id":"…","emailStatus":"skipped"}

sudo mysql -usutrakriti -psutrakriti_dev_pw sutrakriti \
  -e "SELECT COUNT(*) FROM custom_orders;"
```

---

## 7. Enabling email locally (optional)

Add these to `.env` and restart:

### Outlook example
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=sutrakriti.help@outlook.com
SMTP_PASSWORD=<your-app-password>
```

### Gmail example (uses App Passwords)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=you@gmail.com
SMTP_PASSWORD=<16-char app password>
```

Check `curl http://localhost:3000/api/health` → `"mail": true`.

---

## 8. Enabling Buy Now (Razorpay) locally

1. Sign in to <https://dashboard.razorpay.com> → API Keys → generate **Test Mode** keys.
2. Add to `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxx
   NEXT_PUBLIC_BUY_NOW_ENABLED=true
   ```
3. Restart `yarn dev`. The **Buy Now** button now appears in every product modal.
4. Test with Razorpay [test cards](https://razorpay.com/docs/payments/payments/test-card-details/) — no real money moves.

---

## 9. Uploading product images locally

Product images are organised by category under `public/products/`:

```
public/products/
├── handbags/          # → served at /products/handbags/<file>
├── potli-bags/
├── flowers/
├── home-decor/
└── uncategorised/
```

Four ways to add images:

```bash
# 1. CLI helper (category is the optional 2nd argument)
./scripts/upload-product-image.sh ./my-tote.jpg handbags

# 2. Direct API call
curl -X POST http://localhost:3000/api/upload \
  -H "x-upload-token: sutrakriti-dev-upload-token" \
  -F "category=handbags" \
  -F "file=@./my-photo.jpg"
# → { ok:true, url:"/products/handbags/1734...jpg", category:"handbags", ... }

# 3. Drop files manually into the correct category folder — served instantly.

# 4. Admin dashboard (/admin) → Uploads tab → pick category → drag & drop.
```

Once uploaded, open `/admin` → **Products** → *Edit* on the target row and
paste the returned URL into the *Images* box.

---

## 10. Managing products & inventory (local)

Products are persisted in the MySQL `products` table (schema created by
`node scripts/init-db.js`). On first boot the table is auto-seeded from
`lib/products.js` with a starting stock of `10` per product.

- **CRUD**: `/admin` → **Products** tab → *New product* / *Edit* / *Delete*.
- **Stock adjustments**: *Stock* button on any row → increment/decrement or
  set an absolute quantity, with a reason (restock / sale / return / damage
  / correction). Movements are appended to `inventory_movements` for a full
  audit trail visible inline in the dialog.
- **Public catalogue**: `GET /api/products` returns only `is_active = 1`
  rows sorted by `sort_order`.
- **Programmatic access**: see the *Managing products & inventory* section
  of [`README.md`](./README.md) for `curl` examples.

Sanity-check queries:

```bash
mysql -usutrakriti -psutrakriti_dev_pw sutrakriti \
  -e "SELECT id, name, stock_quantity, is_active FROM products ORDER BY sort_order LIMIT 20;"

mysql -usutrakriti -psutrakriti_dev_pw sutrakriti \
  -e "SELECT * FROM inventory_movements ORDER BY created_at DESC LIMIT 20;"
```

---

## 11. Useful commands

```bash
yarn dev            # dev server (hot reload)
yarn build          # production build
yarn start          # start the production build
yarn lint           # eslint

node scripts/init-db.js                # (re)create MySQL schema + seed products
bash scripts/setup-local.sh            # one-shot setup
bash scripts/upload-product-image.sh <file>

sudo mysql -usutrakriti -psutrakriti_dev_pw sutrakriti
```

---

## 12. Common gotchas

| Symptom | Fix |
|---|---|
| `Password:` prompt from `setup-local.sh` on macOS asks a password and rejects it | That prompt is from `sudo` (asking your **macOS login password**), not MariaDB. On macOS, MariaDB installed via Homebrew doesn't need `sudo`. Update `scripts/setup-local.sh` to the latest version (it now auto-detects macOS) or just type your Mac login password once. |
| `Access denied for user 'root'@'localhost'` | Use the dedicated `sutrakriti` user (see 4.1). |
| `ECONNREFUSED 127.0.0.1:3306` | MariaDB isn't running: `brew services start mariadb` (macOS) or `sudo service mariadb start` (Linux). |
| `EADDRINUSE :3000` | Another process on 3000. Kill it or `PORT=3001 yarn dev`. |
| Buy Now still hidden after env changes | Restart `yarn dev` — Next.js reads env at boot. |
| Uploads land in DB but not on disk | Ensure `public/products/` exists & is writable. |
| Storefront shows no products | Run `node scripts/init-db.js` — it seeds the `products` table from `lib/products.js` when empty. |
| Stock button returns `insufficient_stock` | Deltas cannot drive stock below 0. Use *Set exact* to override, or top up first with a positive delta. |

---

## 13. Next steps

- 🧩 Explore `app/page.js` — all sections are top-level components.
- 🎨 Colors & tokens live in `app/globals.css` (`:root` and `@layer utilities`).
- 🗄 API routes live in `app/api/[[...path]]/route.js` (single catch-all).
- 📦 Product persistence lives in `lib/productsDb.js`; static seed data in
  `lib/products.js`; schema/DDL in `lib/db.js` + `scripts/init-db.js`.
- 📚 Full docs: [`README.md`](./README.md), production: [`DEPLOYMENT.md`](./DEPLOYMENT.md).
