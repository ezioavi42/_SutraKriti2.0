# Deploying SutraKriti to MilesWeb (Node.js Hosting)

This guide walks you through a **production deployment of SutraKriti** on a MilesWeb **Node.js Hosting** subscription plan, from account setup to a live URL with MySQL, SMTP and Razorpay wired in.

> This guide is written for MilesWeb’s **mPanel** workflow. If your hosting plan uses slightly different wording, the equivalent sections are usually named **Node.js App**, **Environment Variables**, **Domain**, and **SSL**.

---

## 0. Prerequisites

- A MilesWeb hosting plan that includes **Node.js hosting** and **MySQL** (Business / Startup / Node.js plans all qualify).
- SSH access enabled on your account if your plan provides it; otherwise use the built-in file manager or Git deployment options.
- A domain pointed to MilesWeb name-servers.
- A local copy of this repository.
- Your **Razorpay** keys (optional) and **SMTP** credentials for outbound email.

---

## 1. Create the MySQL database

1. Log into MilesWeb mPanel and open the **MySQL / Database** section.
2. Create a database, e.g. `youracct_sutrakriti`.
3. Create a database user with a strong password and add that user to the database, granting **ALL PRIVILEGES**.
4. Note the following — you’ll need them shortly:
   - `MYSQL_HOST` — usually `localhost` on shared MilesWeb; on VPS it may be `127.0.0.1` or a private IP.
   - `MYSQL_PORT` — `3306`.
   - `MYSQL_USER` — the prefixed user (e.g. `youracct_sk`).
   - `MYSQL_PASSWORD` — the password you set.
   - `MYSQL_DATABASE` — the prefixed DB name.

---

## 2. Create the Node.js application in mPanel

1. Open the MilesWeb mPanel hosting area for your site and create or edit the **Node.js application**.
2. Set:
   - **Node.js version**: `20.x` (or the latest available; 18+ works).
   - **Application mode**: `Production`.
   - **Application root**: the folder that contains `package.json`, for example `/public_html/_SutraKriti2.0` or `/public_html/your-domain/sutrakriti`.
   - **Application URL**: your domain / subdomain (e.g. `www.sutrakriti.com`).
   - **Startup command**: `node server.js` (set this after you add the file in step 6).
3. Save the app and note the app root path. If your mPanel exposes a terminal or SSH access, keep that information handy for the build step below.

---

## 3. Upload the code

Two options — pick whichever is faster.

### Option A — Git deploy (recommended)
```bash
ssh youracct@yourdomain.com
cd ~/sutrakriti
git clone https://github.com/<your-org>/sutrakriti.git .
```

### Option B — SFTP upload
Upload the repo contents (skip `node_modules/`, `.next/`, `.env.local`) via FileZilla/Cyberduck into the app root you configured in mPanel, for example `~/public_html/_SutraKriti2.0/`.

---

## 4. Configure `.env`

Create `~/sutrakriti/.env` with production values:

```env
NEXT_PUBLIC_BASE_URL=https://www.sutrakriti.com
CORS_ORIGINS=https://www.sutrakriti.com

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_SOCKET=/var/lib/mysql/mysql.sock
MYSQL_USER=youracct_sk
MYSQL_PASSWORD=your-strong-password
MYSQL_DATABASE=youracct_sutrakriti

# Razorpay (leave empty to keep Buy Now disabled)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_BUY_NOW_ENABLED=false

# SMTP (Outlook example)
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=sutrakriti.help@outlook.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=SutraKriti <sutrakriti.help@outlook.com>
ORDERS_EMAIL=sutrakriti.help@outlook.com

# Uploads
UPLOAD_DIR=public/products
UPLOAD_TOKEN=<generate-a-long-random-string>

# Brand
WHATSAPP_NUMBER=917777932385
BRAND_INSTAGRAM=https://www.instagram.com/_sutrakriti
BRAND_EMAIL=sutrakriti.help@outlook.com
```

> ⚠️ **Never commit `.env` to git.** It contains secrets.

Add them also in mPanel → **Environment Variables** for the Node.js app (some shared-hosting setups read the runtime variables from the panel, so adding both is safest).

### Configure the admin dashboard
The admin UI lives at `/admin` and is protected by the password in `ADMIN_PASSWORD`.

Add these values to your local `.env` file and to the MilesWeb Node.js App environment variables:

```env
ADMIN_PASSWORD=choose-a-strong-password
ADMIN_SESSION_SECRET=generate-a-random-long-string
```

- **Localhost**: set them before running `npm run dev`, then open `http://localhost:3000/admin` and sign in with `ADMIN_PASSWORD`.
- **MilesWeb production**: add the same values in mPanel → **Environment Variables** for the Node.js app, then restart the app. After the app restarts, open `https://your-domain/admin` and sign in with the same password.
- If login fails, confirm the password matches exactly and that the app was restarted so the new environment variables are picked up.

---

## 5. Install & build

From the SSH session (or the mPanel terminal if available), go to your app root and run:

```bash
cd ~/public_html/_SutraKriti2.0
npm install
node scripts/init-db.js                    # creates all MySQL tables (safe to re-run)
npm run build                              # produces .next/ production bundle
```

The build should end with `Compiled successfully`.

> On shared hosting such as MilesWeb, the build can fail with `spawn ... node EAGAIN` if Next.js tries to use too many workers. The project now limits build concurrency in `next.config.js`, but if you still see this error, run the build again in the app directory after a short pause.

---

## 6. Configure the startup command

MilesWeb’s Node app runner needs a startup command. In mPanel or the Node app settings, set:

```bash
node server.js
```

Create `server.js` at the project root (only for production):

```js
// server.js — production entry for MilesWeb mPanel / Node.js app
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const port = Number(process.env.PORT || 3000)
const hostname = process.env.HOSTNAME || '0.0.0.0'
const app = next({ dev: false, hostname })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  server.listen(port, hostname, () => {
    console.log(`▲ SutraKriti ready on http://${hostname}:${port}`)
  })
})
```

> Use `node server.js` as the startup command in MilesWeb. The app should be deployed at the project root, and the `.env` file should contain the MySQL and admin environment variables before you start it.

In MilesWeb mPanel → your Node.js app settings, set:
- **Startup command**: `node server.js`
- **Application root**: the folder that contains `package.json` and `server.js`
- Click **Restart**.

> Alternative: keep the built-in Next start script (`node_modules/next/dist/bin/next`) with argument `start`. Both work; `server.js` is more portable and is the recommended option for this project.

---

## 7. Point the domain

mPanel → **Domain / Domains** → make sure your live domain is assigned to the Node.js app and that the app URL points to the correct domain/subdomain. If you are using a **subdomain** (e.g. `shop.sutrakriti.com`), create it in the domain section first, then re-open the Node.js app settings and re-select the domain.

---

## 8. Enable HTTPS

mPanel → **SSL / HTTPS** → select the domain → enable or renew the certificate. MilesWeb will issue a Let’s Encrypt certificate within minutes.

Update `NEXT_PUBLIC_BASE_URL` in `.env` to the `https://` version if not already.

---

## 9. Smoke tests

```bash
curl -sf https://www.sutrakriti.com/api/health | jq
# → { "ok": true, "db": true, "mail": true }

curl -sf https://www.sutrakriti.com/api/products | jq '.products | length'
# → 8
```

Submit a test custom-order from the site → you should receive the styled email at `ORDERS_EMAIL`.

---

## 10. Syncing the product catalogue to production

If you already have a complete product catalogue in your local development database and want to copy it into the production MySQL database, the safest path is to use a one-off sync script rather than trying to recreate rows manually.

### Recommended workflow

1. Export the local catalogue from your development MySQL database (or use the existing local database directly if you can reach it from the server).
2. Set the source and target connection variables in the server environment.
3. Run the sync script from the app root:

```bash
# dry run first
node scripts/sync-products.js --dry-run

# then run the real sync
node scripts/sync-products.js
```

### Environment variables

For the source database (local or another host), set:

```env
SOURCE_MYSQL_HOST=127.0.0.1
SOURCE_MYSQL_PORT=3306
SOURCE_MYSQL_SOCKET=/run/mysqld/mysqld.sock
SOURCE_MYSQL_USER=your_source_user
SOURCE_MYSQL_PASSWORD=your_source_password
SOURCE_MYSQL_DATABASE=your_source_db
```

For the target production database, keep using the normal production values:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_SOCKET=/run/mysqld/mysqld.sock
MYSQL_USER=your_prod_user
MYSQL_PASSWORD=your_prod_password
MYSQL_DATABASE=your_prod_db
```

### Notes

- The sync script updates matching product IDs and leaves the production database otherwise intact.
- If you want to remove any products that no longer exist in the source database, run:

```bash
node scripts/sync-products.js --delete-missing
```

- This is safer than manually inserting rows because it preserves the current production schema and avoids duplicate IDs.

---

## 11. Uploading product images (production)

### Manual (fastest)
mPanel → **File Manager** → the app root’s `public/products/<category>/` folder (one of
`handbags`, `potli-bags`, `flowers`, `home-decor`, `uncategorised`) → upload
your `.webp` / `.jpg` files.

Because product data now lives in **MySQL** (see §17 below), you no longer need
to edit `lib/products.js`. Instead, open `/admin` → **Products** → *Edit* the
row and paste the image URL (`/products/<category>/<file>`) into the *Images*
box. Save. No redeploy required.

### API (remote)
```bash
curl -X POST https://www.sutrakriti.com/api/upload \
  -H "x-upload-token: $UPLOAD_TOKEN" \
  -F "category=handbags" \
  -F "file=@./my-tote.jpg"
```

### CLI helper
```bash
UPLOAD_TOKEN=... NEXT_PUBLIC_BASE_URL=https://www.sutrakriti.com \
  ./scripts/upload-product-image.sh ./my-tote.jpg handbags
```

### Admin dashboard drag & drop
Sign in at `https://www.sutrakriti.com/admin`, open the **Uploads** tab, choose
a category, drop your files. Auth is your `sk_admin` cookie — no token exposed.

---

## 11. Enabling Razorpay in production

1. In Razorpay Dashboard → **Account & Settings → API Keys**, generate **Live** keys.
2. In mPanel → **Environment Variables** for the Node.js app:
   ```
   RAZORPAY_KEY_ID=rzp_live_...
   RAZORPAY_KEY_SECRET=...
   NEXT_PUBLIC_BUY_NOW_ENABLED=true
   ```
3. Click **Restart**.
4. Verify by opening a product → you should now see **Buy Now** alongside **Order on WhatsApp**.

---

## 12. Hardening checklist for production

- [ ] Rotate `UPLOAD_TOKEN` to a long random string. Store it in a password manager.
- [ ] Add HTTP-basic-auth or a simple bearer check in front of `/api/admin/*` (see `route.js`, easy to add in `handleRoute`).
- [ ] Set `CORS_ORIGINS` to your exact domain (not `*`).
- [ ] Configure MilesWeb’s daily backups **and** run a nightly `mysqldump` cron:
  ```bash
  0 2 * * * mysqldump -u$MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE | gzip > ~/backups/sk-$(date +\%F).sql.gz
  ```
- [ ] Enable **fail2ban** / Cloudflare in front of the domain to rate-limit `/api/upload` and `/api/custom-order` if abused.
- [ ] Verify `robots.txt` and `/sitemap.xml` (add a static one under `public/` when catalogue stabilises).
- [ ] Confirm the Razorpay **Webhook** URL if you later add asynchronous fulfillment.

---

## 13. Updating the app

With a Git-based deploy:
```bash
ssh youracct@yourdomain.com
cd ~/sutrakriti
git pull --ff-only
yarn install --frozen-lockfile
yarn build
```
Then restart the Node.js app from mPanel.

---

## 14. Rolling back

```bash
git log --oneline -5
git checkout <previous-sha>
yarn build
# restart via mPanel
```
MySQL migrations are additive; no rollback DDL needed for this project.

---

## 15. Alternative deployment targets

### Vercel
1. Push repo to GitHub.
2. Import into Vercel.
3. Add the same `.env` variables in the Vercel dashboard.
4. Provision MySQL on **PlanetScale**, **Railway** or a MilesWeb VPS with public MySQL enabled.
5. Note: file uploads on Vercel are ephemeral. For production uploads, store files in S3 / R2 instead of `public/products/` — the `/api/upload` route can be adapted in ~15 lines.

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
EXPOSE 3000
CMD ["node", "server.js"]
```
`docker run -p 3000:3000 --env-file .env sutrakriti`

---

## 16. Troubleshooting

| Symptom | Fix |
|---|---|
| `Access denied for user '...'@'localhost'` on first API call | Wrong `MYSQL_USER/PASSWORD`; run `node scripts/init-db.js` manually to reproduce. |
| API works but email never arrives | Check `curl /api/health` → `mail: true`. If false, SMTP env vars are missing. Otherwise check Outlook “Sent” + junk folder; for Outlook, use an **app password**, not your account password. |
| Buy Now stays hidden even after adding keys | `NEXT_PUBLIC_BUY_NOW_ENABLED` must be `true` **and** you must restart the app so Next.js re-reads env vars at build/render time. |
| Uploads return `401 unauthorised` | Header `x-upload-token` must match `UPLOAD_TOKEN` in `.env`. |
| Images 404 after upload | Ensure `public/products/` is writable (`chmod 755`) and the Passenger user owns it. |
| Site returns 502 after `yarn build` | `.next/` was built with a different Node version. Rebuild inside the same virtualenv. |

---

## 17. Managing products & inventory (production)

Products are stored in the `products` table; stock changes are audited in
`inventory_movements`. To administer the catalogue in production:

1. Log in at `https://<your-domain>/admin` with the `ADMIN_PASSWORD` from
   `.env`.
2. Open the **Products** tab.
3. Use *New product*, *Edit*, *Delete* and *Stock* buttons directly. No
   SSH or redeploy is required — every action writes to MySQL and reflects
   on the storefront immediately.
4. Overview stat cards surface totals, low-stock and out-of-stock counts.

Recommended production hardening:

- Take nightly `mysqldump` backups (see §12) so `products` and
  `inventory_movements` are recoverable.
- Rotate `ADMIN_PASSWORD` after any staff change; the `sk_admin` cookie is
  HMAC-signed against `ADMIN_SESSION_SECRET` (fall-through: `ADMIN_PASSWORD`).
- If you migrate from a pre-persistence install, `node scripts/init-db.js`
  (safe to re-run) creates the new tables **and** seeds from the legacy
  `lib/products.js` file if the table is empty.

For the full API surface (list / create / update / delete / stock adjust /
movement history), see the *Managing products & inventory* section of the
main [`README.md`](./README.md).

---

## 18. Support contacts

- **MilesWeb support**: <https://www.milesweb.in/support>
- **Razorpay integration issues**: <https://razorpay.com/support/>
- **Repo issues / feature requests**: use the Git provider’s issue tracker.

— *Deployed with love, one thread at a time.*
