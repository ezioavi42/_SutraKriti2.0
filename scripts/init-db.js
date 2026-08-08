#!/usr/bin/env node
// SutraKriti — initialise MySQL schema. Safe to re-run.
// Usage: node scripts/init-db.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

async function main() {
  const mysql = require('mysql2/promise')
  const socketPath = process.env.MYSQL_SOCKET || process.env.DB_SOCKET || ''
  const connectionConfig = {
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    multipleStatements: true,
  }

  if (socketPath) {
    connectionConfig.socketPath = socketPath
  } else {
    connectionConfig.host = process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1'
    connectionConfig.port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306)
  }

  const conn = await mysql.createConnection(connectionConfig)
  const dbName = process.env.MYSQL_DATABASE || 'sutrakriti'
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await conn.changeUser({ database: dbName })

  const statements = [
    `CREATE TABLE IF NOT EXISTS custom_orders (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact VARCHAR(64) NOT NULL,
      email VARCHAR(255),
      product_type VARCHAR(255),
      colors VARCHAR(255),
      size VARCHAR(255),
      budget VARCHAR(64),
      occasion VARCHAR(255),
      reference_image TEXT,
      notes TEXT,
      status VARCHAR(32) DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX(created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS contacts (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS newsletter (
      email VARCHAR(255) PRIMARY KEY,
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS payments (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64),
      product_name VARCHAR(255),
      image TEXT,
      amount INT,
      currency VARCHAR(8) DEFAULT 'INR',
      razorpay_order_id VARCHAR(128),
      razorpay_payment_id VARCHAR(128),
      status VARCHAR(32) DEFAULT 'created',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      verified_at DATETIME NULL,
      INDEX(razorpay_order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS uploads (
      id VARCHAR(64) PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      url TEXT NOT NULL,
      mime VARCHAR(64),
      size_bytes INT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(128),
      price INT NOT NULL DEFAULT 0,
      description TEXT,
      material VARCHAR(255),
      dimensions VARCHAR(255),
      care VARCHAR(255),
      delivery VARCHAR(128),
      colors TEXT,
      images TEXT,
      is_new TINYINT(1) NOT NULL DEFAULT 0,
      is_bestseller TINYINT(1) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      stock_quantity INT NOT NULL DEFAULT 0,
      low_stock_threshold INT NOT NULL DEFAULT 3,
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX(category),
      INDEX(is_active),
      INDEX(sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS inventory_movements (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(64) NOT NULL,
      delta INT NOT NULL,
      reason VARCHAR(64) NOT NULL,
      note TEXT,
      resulting_quantity INT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX(product_id),
      INDEX(created_at),
      CONSTRAINT fk_inv_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ]
  for (const s of statements) await conn.query(s)

  // Seed products table from the legacy static catalogue if empty.
  const [countRows] = await conn.query('SELECT COUNT(*) AS n FROM products')
  if (Number(countRows?.[0]?.n || 0) === 0) {
    let legacy = []
    try {
      const fs = require('fs'); const p = require('path')
      const src = fs.readFileSync(p.join(__dirname, '..', 'lib', 'products.js'), 'utf8')
      // Strip export keyword and evaluate as CommonJS.
      const cjs = src.replace(/export\s+const\s+PRODUCTS\s*=/, 'const PRODUCTS =') + '\nmodule.exports = { PRODUCTS };'
      // eslint-disable-next-line no-new-func
      const mod = { exports: {} }
      new Function('module', 'exports', cjs)(mod, mod.exports)
      legacy = mod.exports.PRODUCTS || []
    } catch (e) { console.warn('[init-db] could not parse legacy catalogue:', e.message) }

    let order = 0
    for (const p of legacy) {
      const images = p.images && p.images.length ? p.images : (p.image ? [p.image] : [])
      const colors = Array.isArray(p.colors) ? p.colors : []
      await conn.query(
        `INSERT INTO products
           (id, name, category, price, description, material, dimensions, care, delivery,
            colors, images, is_new, is_bestseller, is_active, stock_quantity, low_stock_threshold, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 10, 3, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [
          p.id, p.name, p.category || null, Number(p.price) || 0,
          p.description || null, p.material || null, p.dimensions || null,
          p.care || null, p.delivery || null,
          JSON.stringify(colors), JSON.stringify(images),
          p.new ? 1 : 0, p.bestseller ? 1 : 0, order++,
        ]
      )
    }
    console.log(`✓ Seeded ${legacy.length} products from legacy catalogue.`)
  }

  console.log(`✓ Database '${dbName}' ready with all tables.`)
  await conn.end()
}

main().catch(err => { console.error(err); process.exit(1) })
