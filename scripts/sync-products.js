#!/usr/bin/env node
// Sync the products catalogue from a source MySQL database to the target MySQL database.
// Usage examples:
//   node scripts/sync-products.js --dry-run
//   SOURCE_MYSQL_HOST=127.0.0.1 SOURCE_MYSQL_PORT=3306 SOURCE_MYSQL_USER=... SOURCE_MYSQL_PASSWORD=... SOURCE_MYSQL_DATABASE=... \
//     node scripts/sync-products.js
//
// The script is intentionally non-destructive: it updates matching product ids in the target
// database and leaves extra target rows alone unless --delete-missing is supplied.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mysql = require('mysql2/promise')

function parseArgs(argv) {
  const result = { dryRun: false, deleteMissing: false }
  for (const arg of argv) {
    if (arg === '--dry-run') result.dryRun = true
    else if (arg === '--delete-missing') result.deleteMissing = true
    else if (arg === '--help' || arg === '-h') result.help = true
  }
  return result
}

function getConfig(prefix) {
  const upper = prefix.toUpperCase()
  const socketPath = process.env[`${upper}_SOCKET`] || process.env.DB_SOCKET || ''
  const config = {
    user: process.env[`${upper}_USER`] || process.env.DB_USER || 'root',
    password: process.env[`${upper}_PASSWORD`] || process.env.DB_PASSWORD || '',
    database: process.env[`${upper}_DATABASE`] || process.env.DB_NAME || 'sutrakriti',
  }

  if (socketPath) {
    config.socketPath = socketPath
  } else {
    config.host = process.env[`${upper}_HOST`] || process.env.DB_HOST || '127.0.0.1'
    config.port = Number(process.env[`${upper}_PORT`] || process.env.DB_PORT || 3306)
  }

  return config
}

async function ensureTable(conn, tableName, createSql) {
  await conn.query(createSql)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    console.log('Usage: node scripts/sync-products.js [--dry-run] [--delete-missing]')
    return
  }

  const sourceConfig = getConfig('SOURCE_MYSQL')
  const targetConfig = getConfig('MYSQL')

  if (!sourceConfig.database || !targetConfig.database) {
    console.error('Missing database configuration. Set SOURCE_MYSQL_* and MYSQL_* values (or DB_* fallbacks).')
    process.exit(1)
  }

  const sourceConn = await mysql.createConnection(sourceConfig)
  const targetConn = await mysql.createConnection(targetConfig)

  try {
    await ensureTable(targetConn, 'products', `
      CREATE TABLE IF NOT EXISTS products (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)

    const [columnsRows] = await sourceConn.query('SHOW COLUMNS FROM products')
    const columns = columnsRows.map(row => row.Field)
    if (!columns.length) {
      throw new Error('No columns found in source products table')
    }

    const [rows] = await sourceConn.query(`SELECT * FROM products ORDER BY id ASC`)
    const columnList = columns.join(', ')
    const placeholders = columns.map(() => '?').join(', ')
    const updates = columns.filter(col => col !== 'id').map(col => `
      ${col} = VALUES(${col})
    `).join(', ')

    console.log(`Found ${rows.length} product rows in source database '${sourceConfig.database}'.`)

    if (args.dryRun) {
      console.log('Dry run only; no rows were written to the target database.')
      return
    }

    for (const row of rows) {
      const values = columns.map(col => row[col])
      await targetConn.query(`
        INSERT INTO products (${columnList})
        VALUES (${placeholders})
        ON DUPLICATE KEY UPDATE ${updates}
      `, values)
    }

    if (args.deleteMissing) {
      const [targetRows] = await targetConn.query('SELECT id FROM products')
      const sourceIds = new Set(rows.map(row => row.id))
      const missingIds = targetRows.map(r => r.id).filter(id => !sourceIds.has(id))
      for (const id of missingIds) {
        await targetConn.query('DELETE FROM products WHERE id = ?', [id])
      }
      console.log(`Deleted ${missingIds.length} products missing from the source database.`)
    }

    console.log(`Synced ${rows.length} product rows to target database '${targetConfig.database}'.`)
  } finally {
    await sourceConn.end()
    await targetConn.end()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
