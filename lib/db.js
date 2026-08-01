import mysql from 'mysql2/promise'

let pool = null
let initialised = false

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'sutrakriti',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      dateStrings: false,
    })
  }
  return pool
}

export async function initSchema() {
  if (initialised) return
  const p = getPool()
  await p.query(`CREATE TABLE IF NOT EXISTS custom_orders (
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
    accepted_at DATETIME NULL,
    completed_at DATETIME NULL,
    acceptance_email_sent_at DATETIME NULL,
    admin_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX(created_at),
    INDEX(status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
  // Idempotent column additions for pre-existing installations
  const [cols] = await p.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'custom_orders'`
  )
  const have = new Set(cols.map(c => c.COLUMN_NAME))
  const adds = []
  if (!have.has('accepted_at')) adds.push('ADD COLUMN accepted_at DATETIME NULL')
  if (!have.has('completed_at')) adds.push('ADD COLUMN completed_at DATETIME NULL')
  if (!have.has('acceptance_email_sent_at')) adds.push('ADD COLUMN acceptance_email_sent_at DATETIME NULL')
  if (!have.has('admin_note')) adds.push('ADD COLUMN admin_note TEXT')
  if (!have.has('updated_at')) adds.push('ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
  if (adds.length) await p.query(`ALTER TABLE custom_orders ${adds.join(', ')}`)
  await p.query(`CREATE TABLE IF NOT EXISTS contacts (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
  await p.query(`CREATE TABLE IF NOT EXISTS newsletter (
    email VARCHAR(255) PRIMARY KEY,
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
  await p.query(`CREATE TABLE IF NOT EXISTS payments (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
  await p.query(`CREATE TABLE IF NOT EXISTS uploads (
    id VARCHAR(64) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    category VARCHAR(64) NULL,
    mime VARCHAR(64),
    size_bytes INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX(category)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
  // Idempotent column addition for pre-existing uploads tables
  const [uCols] = await p.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'uploads'`
  )
  const uHave = new Set(uCols.map(c => c.COLUMN_NAME))
  if (!uHave.has('category')) {
    await p.query(`ALTER TABLE uploads ADD COLUMN category VARCHAR(64) NULL, ADD INDEX(category)`)
  }

  // Products (persisted catalogue) + inventory
  await p.query(`CREATE TABLE IF NOT EXISTS products (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)

  // Inventory stock movements audit trail (append-only)
  await p.query(`CREATE TABLE IF NOT EXISTS inventory_movements (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)

  initialised = true
}

export async function query(sql, params = []) {
  await initSchema()
  const [rows] = await getPool().execute(sql, params)
  return rows
}
