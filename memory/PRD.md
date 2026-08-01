# SutraKriti — PRD

## Original problem statement
> With reference to the source code in the linked repository from GitHub
> (https://github.com/ezioavi42/_SutraKriti2.0.git), perform the following
> tasks:
> 1. Persist the products and all their metadata in the existing MySQL DB.
> 2. Update the admin dashboard with CRUD functionality for products.
> 3. Add inventory management — every product shows current stock qty.
> 4. Update the documentation accordingly.

## User choices
- MariaDB (already in the repo) is the target DB.
- Existing JWT/HMAC cookie admin auth (`ADMIN_PASSWORD`) is used.
- Simple stock quantity per product with adjust (+/-) capability.
- Update the existing `README.md`, `DEPLOYMENT.md`, `LOCAL_DEV.md`.

## Architecture

- **Stack**: Next.js 15 (App Router, JS) · MariaDB · Tailwind + shadcn/ui.
- **New tables**
  - `products` — full product metadata + `stock_quantity`,
    `low_stock_threshold`, `is_active`, `sort_order`, JSON `images` /
    `colors`.
  - `inventory_movements` — append-only audit trail with `delta`,
    `reason`, `note`, `resulting_quantity`. FK → `products.id`.
- **Data access**: `lib/productsDb.js` (list/get/create/update/delete +
  `adjustStock` with transactional `SELECT … FOR UPDATE`).
- **Seeding**: on first API request (or via `node scripts/init-db.js`)
  the `products` table is auto-populated from the legacy
  `lib/products.js` catalogue with a starting stock of `10` and low-
  stock threshold of `3`. Idempotent — only runs when the table is
  empty.
- **Public API** (`GET /api/products*`) now reads from MySQL — the
  storefront JSON shape stays backwards-compatible (top-level `image`,
  `images`, `colors`, `new`, `bestseller`, plus new `stockQuantity`).
- **Admin API** (all under `sk_admin` cookie): CRUD at
  `/api/admin/products[/…]`, inventory adjust at
  `/api/admin/products/:id/stock`, history at
  `/api/admin/products/:id/stock/movements`.
- **Admin UI** (`/admin`): new **Products** tab with searchable/
  filterable table, `New product` / `Edit` / `Delete` / `Stock`
  actions, and a stock dialog offering `Adjust (+/-)` or `Set exact`
  with reasons, plus inline movement history.

## What's been implemented

### 2026-01-XX — Persist products + inventory management
- MySQL schema: `products`, `inventory_movements` (with FK cascade).
- `lib/productsDb.js` — full CRUD + stock adjust helpers.
- `scripts/init-db.js` — creates new tables and seeds the catalogue.
- API — public products endpoints now DB-backed; admin routes:
  - `GET/POST /api/admin/products`
  - `GET/PATCH/DELETE /api/admin/products/:id`
  - `POST /api/admin/products/:id/stock` (delta or set, with reason)
  - `GET /api/admin/products/:id/stock/movements`
  - `/api/admin/stats` extended with `products` aggregate.
- Admin dashboard — new **Products** tab with:
  - Table (image, name, category, price, stock badge, status, actions)
  - Search, category filter, stock filter
  - `New product` + `Edit` product dialog (all metadata fields, tick
    Active / New / Bestseller)
  - `Stock` dialog with adjust/set modes, reason dropdown,
    increment/decrement buttons, movement history
- Docs — README, DEPLOYMENT.md, LOCAL_DEV.md all updated with new
  schema, endpoints, dashboard workflow and troubleshooting.
- Supervisor — MariaDB + Next.js + socat proxy (8001→3000) so
  external `/api/*` traffic reaches Next.js.

### Tests
- Backend pytest suite `/app/tests/test_backend_products.py` — 14/14
  passing. Frontend E2E via testing agent — 100%.

## Prioritised backlog
- **P1** — Wire stock deductions to Razorpay `verify` (auto-decrement
  on successful payment).
- **P1** — Storefront: greyed-out "Out of stock" badge on product
  cards / disable "Buy Now" when `stockQuantity === 0`.
- **P2** — CSV import/export of products & inventory.
- **P2** — Email alert to `ORDERS_EMAIL` when a product crosses its
  low-stock threshold.
- **P3** — Split `route.js` into per-domain modules for maintainability.
- **P3** — Standardise API response casing (currently mixes
  camelCase in new endpoints with legacy snake_case rows).

## Next tasks
- User review of the admin flow.
- Sync stock decrement to sales/payments (see backlog P1).
