// Persistent product catalogue backed by MySQL.
//
// A single source of truth (the `products` table) replaces the static list in
// `lib/products.js`. On first boot we seed the DB from the legacy catalogue so
// existing installations stay populated. Inventory (stock_quantity) is tracked
// on the products row itself; every change is also written to
// `inventory_movements` for a lightweight audit trail.

import { v4 as uuidv4 } from 'uuid'
import { query, getPool, initSchema } from './db'
import { PRODUCTS as LEGACY_PRODUCTS } from './products'

let seedChecked = false

function parseJSONArray(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v : []
  } catch {
    return String(raw).split(',').map(s => s.trim()).filter(Boolean)
  }
}

// Convert a DB row into the shape the storefront expects.
export function rowToProduct(row) {
  if (!row) return null
  const images = parseJSONArray(row.images)
  const colors = parseJSONArray(row.colors)
  return {
    id: row.id,
    name: row.name,
    category: row.category || '',
    price: Number(row.price) || 0,
    description: row.description || '',
    material: row.material || '',
    dimensions: row.dimensions || '',
    care: row.care || '',
    delivery: row.delivery || '',
    colors,
    images,
    image: images[0] || null,
    new: !!row.is_new,
    bestseller: !!row.is_bestseller,
    isActive: row.is_active === undefined ? true : !!row.is_active,
    stockQuantity: Number(row.stock_quantity) || 0,
    lowStockThreshold: Number(row.low_stock_threshold) || 0,
    sortOrder: Number(row.sort_order) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Ensure the products table has at least the legacy catalogue. Idempotent.
export async function seedProductsIfEmpty() {
  await initSchema()
  if (seedChecked) return
  const rows = await query('SELECT COUNT(*) AS n FROM products')
  const count = Number(rows?.[0]?.n || 0)
  if (count === 0 && Array.isArray(LEGACY_PRODUCTS) && LEGACY_PRODUCTS.length) {
    const pool = getPool()
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      let order = 0
      for (const p of LEGACY_PRODUCTS) {
        const images = p.images && p.images.length ? p.images : (p.image ? [p.image] : [])
        const colors = Array.isArray(p.colors) ? p.colors : []
        await conn.execute(
          `INSERT INTO products (
             id, name, category, price, description, material, dimensions, care, delivery,
             colors, images, is_new, is_bestseller, is_active, stock_quantity, low_stock_threshold, sort_order
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 3, ?)
           ON DUPLICATE KEY UPDATE name=VALUES(name)`,
          [
            p.id, p.name, p.category || null, Number(p.price) || 0,
            p.description || null, p.material || null, p.dimensions || null,
            p.care || null, p.delivery || null,
            JSON.stringify(colors), JSON.stringify(images),
            p.new ? 1 : 0, p.bestseller ? 1 : 0,
            10, // sensible starting stock so shoppers see availability
            order++,
          ]
        )
      }
      await conn.commit()
      console.log(`[productsDb] Seeded ${LEGACY_PRODUCTS.length} products from legacy catalogue.`)
    } catch (e) {
      await conn.rollback()
      console.error('[productsDb] seed failed:', e?.message)
    } finally {
      conn.release()
    }
  }
  seedChecked = true
}

export async function listProducts({ includeInactive = false } = {}) {
  await seedProductsIfEmpty()
  const rows = includeInactive
    ? await query('SELECT * FROM products ORDER BY sort_order ASC, created_at ASC')
    : await query('SELECT * FROM products WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC')
  return rows.map(rowToProduct)
}

export async function getProduct(id, { includeInactive = false } = {}) {
  await seedProductsIfEmpty()
  const rows = includeInactive
    ? await query('SELECT * FROM products WHERE id = ? LIMIT 1', [id])
    : await query('SELECT * FROM products WHERE id = ? AND is_active = 1 LIMIT 1', [id])
  return rowToProduct(rows?.[0])
}

function slugifyId(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || `p-${uuidv4().slice(0, 8)}`
}

const ALLOWED_FIELDS = new Set([
  'name', 'category', 'price', 'description', 'material', 'dimensions',
  'care', 'delivery', 'colors', 'images', 'is_new', 'is_bestseller',
  'is_active', 'stock_quantity', 'low_stock_threshold', 'sort_order',
])

function normalisePayload(input, { isCreate = false } = {}) {
  const p = { ...input }
  const out = {}
  // Camel → snake helpers
  if (p.isNew !== undefined) p.is_new = p.isNew
  if (p.isBestseller !== undefined) p.is_bestseller = p.isBestseller
  if (p.isActive !== undefined) p.is_active = p.isActive
  if (p.stockQuantity !== undefined) p.stock_quantity = p.stockQuantity
  if (p.lowStockThreshold !== undefined) p.low_stock_threshold = p.lowStockThreshold
  if (p.sortOrder !== undefined) p.sort_order = p.sortOrder

  for (const k of Object.keys(p)) {
    if (!ALLOWED_FIELDS.has(k)) continue
    let v = p[k]
    if (k === 'images' || k === 'colors') {
      if (typeof v === 'string') v = v.split(',').map(s => s.trim()).filter(Boolean)
      if (!Array.isArray(v)) v = []
      out[k] = JSON.stringify(v)
    } else if (k === 'is_new' || k === 'is_bestseller' || k === 'is_active') {
      out[k] = v ? 1 : 0
    } else if (k === 'price' || k === 'stock_quantity' || k === 'low_stock_threshold' || k === 'sort_order') {
      const n = Number(v)
      out[k] = Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0
    } else {
      out[k] = v === '' ? null : (v ?? null)
    }
  }
  if (isCreate) {
    if (out.stock_quantity === undefined) out.stock_quantity = 0
    if (out.low_stock_threshold === undefined) out.low_stock_threshold = 3
    if (out.is_active === undefined) out.is_active = 1
    if (out.sort_order === undefined) out.sort_order = 999
  }
  return out
}

export async function createProduct(payload) {
  await seedProductsIfEmpty()
  if (!payload?.name) {
    const e = new Error('name required'); e.status = 400; throw e
  }
  const id = payload.id?.trim() || slugifyId(payload.name)
  const dup = await query('SELECT id FROM products WHERE id = ?', [id])
  if (dup.length) {
    const e = new Error('product id already exists'); e.status = 409; throw e
  }
  const data = normalisePayload(payload, { isCreate: true })
  const cols = ['id', ...Object.keys(data)]
  const placeholders = cols.map(() => '?').join(', ')
  const vals = [id, ...Object.values(data)]
  await query(`INSERT INTO products (${cols.join(', ')}) VALUES (${placeholders})`, vals)

  // Record initial stock movement if any
  if ((data.stock_quantity || 0) > 0) {
    await recordMovement(id, data.stock_quantity, 'initial', 'Initial stock on product creation', data.stock_quantity)
  }
  return getProduct(id, { includeInactive: true })
}

export async function updateProduct(id, payload) {
  await seedProductsIfEmpty()
  const existing = await query('SELECT * FROM products WHERE id = ?', [id])
  if (!existing.length) {
    const e = new Error('product not found'); e.status = 404; throw e
  }
  const prev = existing[0]
  const data = normalisePayload(payload)
  // stock_quantity is handled via adjustStock, so ignore accidental direct writes here
  delete data.stock_quantity
  if (!Object.keys(data).length) return rowToProduct(prev)
  const sets = Object.keys(data).map(k => `${k} = ?`).join(', ')
  const vals = [...Object.values(data), id]
  await query(`UPDATE products SET ${sets} WHERE id = ?`, vals)
  return getProduct(id, { includeInactive: true })
}

export async function deleteProduct(id) {
  await seedProductsIfEmpty()
  const rows = await query('SELECT id FROM products WHERE id = ?', [id])
  if (!rows.length) {
    const e = new Error('product not found'); e.status = 404; throw e
  }
  await query('DELETE FROM products WHERE id = ?', [id])
  return { ok: true, id }
}

async function recordMovement(productId, delta, reason, note, resulting) {
  await query(
    `INSERT INTO inventory_movements (id, product_id, delta, reason, note, resulting_quantity)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), productId, delta, reason || 'adjust', note || null, resulting]
  )
}

// mode: 'delta' (default, increment) or 'set' (absolute value)
export async function adjustStock(id, quantity, { mode = 'delta', reason = 'adjust', note = null } = {}) {
  await seedProductsIfEmpty()
  const pool = getPool()
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const [rows] = await conn.execute('SELECT * FROM products WHERE id = ? FOR UPDATE', [id])
    if (!rows.length) {
      await conn.rollback()
      const e = new Error('product not found'); e.status = 404; throw e
    }
    const current = Number(rows[0].stock_quantity) || 0
    const qty = Number(quantity)
    if (!Number.isFinite(qty)) {
      await conn.rollback()
      const e = new Error('quantity must be a number'); e.status = 400; throw e
    }
    let next
    let delta
    if (mode === 'set') {
      if (qty < 0) { await conn.rollback(); const e = new Error('quantity cannot be negative'); e.status = 400; throw e }
      next = Math.trunc(qty)
      delta = next - current
    } else {
      delta = Math.trunc(qty)
      next = current + delta
      if (next < 0) {
        await conn.rollback()
        const e = new Error('insufficient_stock'); e.status = 400; e.detail = { current, delta }; throw e
      }
    }
    await conn.execute('UPDATE products SET stock_quantity = ? WHERE id = ?', [next, id])
    await conn.execute(
      `INSERT INTO inventory_movements (id, product_id, delta, reason, note, resulting_quantity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), id, delta, reason || (mode === 'set' ? 'set' : 'adjust'), note || null, next]
    )
    await conn.commit()
    return { id, previousQuantity: current, delta, stockQuantity: next }
  } finally {
    conn.release()
  }
}

export async function listStockMovements(productId, limit = 100) {
  await seedProductsIfEmpty()
  const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 100))
  const rows = await query(
    `SELECT * FROM inventory_movements WHERE product_id = ? ORDER BY created_at DESC LIMIT ${safeLimit}`,
    [productId]
  )
  return rows
}
