#!/usr/bin/env node
// SutraKriti — initialise MySQL schema. Safe to re-run.
// Usage: node scripts/init-db.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

async function main() {
  const mysql = require('mysql2/promise')
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    multipleStatements: true,
  })
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
  ]
  for (const s of statements) await conn.query(s)
  console.log(`✓ Database '${dbName}' ready with all tables.`)
  await conn.end()
}

main().catch(err => { console.error(err); process.exit(1) })
