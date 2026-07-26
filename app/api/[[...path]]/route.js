import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { query, initSchema } from '@/lib/db'
import { sendMail, renderCustomOrderEmail, isMailConfigured } from '@/lib/mailer'
import { PRODUCTS } from '@/lib/products'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-upload-token')
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  return res
}
export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 200 }))
}

function ok(data, status = 200) { return cors(NextResponse.json(data, { status })) }
function err(message, status = 400, extra = {}) { return cors(NextResponse.json({ error: message, ...extra }, { status })) }

function slugify(s = '') {
  return String(s).toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

async function handleUpload(request) {
  const token = request.headers.get('x-upload-token') || ''
  const expected = process.env.UPLOAD_TOKEN
  if (!expected || token !== expected) return err('unauthorised', 401)

  let form
  try { form = await request.formData() } catch { return err('multipart/form-data required', 400) }
  const file = form.get('file')
  if (!file || typeof file === 'string') return err('file field required', 400)

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
  const mime = file.type || 'application/octet-stream'
  if (!allowed.includes(mime)) return err(`unsupported mime type: ${mime}`, 415)

  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.byteLength > 8 * 1024 * 1024) return err('file too large (max 8 MB)', 413)

  const uploadDir = process.env.UPLOAD_DIR || 'public/products'
  const absDir = path.isAbsolute(uploadDir) ? uploadDir : path.join(process.cwd(), uploadDir)
  await fs.mkdir(absDir, { recursive: true })

  const original = file.name || 'image'
  const ext = (path.extname(original) || '.jpg').toLowerCase()
  const base = slugify(path.basename(original, path.extname(original))) || 'image'
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${base}${ext}`
  const abs = path.join(absDir, filename)
  await fs.writeFile(abs, buf)

  const url = `/products/${filename}`
  const id = uuidv4()
  try {
    await query(
      'INSERT INTO uploads (id, filename, url, mime, size_bytes) VALUES (?, ?, ?, ?, ?)',
      [id, filename, url, mime, buf.byteLength]
    )
  } catch (e) { console.error('[upload] db insert failed:', e?.message) }

  return ok({ ok: true, id, filename, url, size: buf.byteLength, mime })
}

async function handleRoute(request, { params }) {
  const { path: parts = [] } = await params
  const route = `/${parts.join('/')}`
  const method = request.method

  try {
    await initSchema()

    if (route === '/' && method === 'GET') {
      return ok({ message: 'SutraKriti API — Every thread tells a story.' })
    }

    // Products (from static catalogue)
    if (route === '/products' && method === 'GET') {
      return ok({ products: PRODUCTS })
    }
    if (route.startsWith('/products/') && method === 'GET') {
      const id = route.split('/')[2]
      const product = PRODUCTS.find(p => p.id === id)
      if (!product) return err('not found', 404)
      return ok({ product })
    }

    // Custom order enquiry -> MySQL + email
    if (route === '/custom-order' && method === 'POST') {
      const body = await request.json()
      if (!body.name || !body.contact) return err('name and contact required', 400)
      const id = uuidv4()
      await query(
        `INSERT INTO custom_orders
          (id, name, contact, email, product_type, colors, size, budget, occasion, reference_image, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, body.name, body.contact, body.email || null, body.productType || null,
         body.colors || null, body.size || null, body.budget || null, body.occasion || null,
         body.referenceImage || null, body.notes || null]
      )

      // Send email notification (non-blocking failure)
      const to = process.env.ORDERS_EMAIL || process.env.BRAND_EMAIL || ''
      let emailStatus = 'skipped'
      if (to && isMailConfigured()) {
        try {
          const { html, text } = renderCustomOrderEmail(body)
          const res = await sendMail({
            to,
            subject: `New Custom Order · ${body.name}${body.productType ? ' · ' + body.productType : ''}`,
            html, text,
            replyTo: body.email || undefined,
          })
          emailStatus = res.ok ? 'sent' : 'failed'
        } catch (e) {
          console.error('[custom-order] email failed:', e?.message)
          emailStatus = 'failed'
        }
      }

      return ok({ ok: true, id, emailStatus })
    }

    // Contact form
    if (route === '/contact' && method === 'POST') {
      const body = await request.json()
      if (!body.name || !body.message) return err('name and message required', 400)
      const id = uuidv4()
      await query('INSERT INTO contacts (id, name, email, message) VALUES (?, ?, ?, ?)',
        [id, body.name, body.email || null, body.message])
      return ok({ ok: true, id })
    }

    // Newsletter
    if (route === '/newsletter' && method === 'POST') {
      const body = await request.json()
      if (!body.email) return err('email required', 400)
      await query(
        'INSERT INTO newsletter (email) VALUES (?) ON DUPLICATE KEY UPDATE subscribed_at = CURRENT_TIMESTAMP',
        [body.email]
      )
      return ok({ ok: true })
    }

    // Razorpay create order (gated on env keys)
    if (route === '/razorpay/order' && method === 'POST') {
      const body = await request.json()
      const product = PRODUCTS.find(p => p.id === body.productId)
      if (!product) return err('product not found', 404)

      const keyId = process.env.RAZORPAY_KEY_ID
      const keySecret = process.env.RAZORPAY_KEY_SECRET
      const buyEnabled = (process.env.NEXT_PUBLIC_BUY_NOW_ENABLED || 'false').toLowerCase() === 'true'
      if (!keyId || !keySecret || !buyEnabled) {
        return err('payment_unconfigured', 503, {
          message: 'Online payment is currently disabled. Please order via WhatsApp.',
          whatsappNumber: process.env.WHATSAPP_NUMBER || '',
        })
      }

      const Razorpay = (await import('razorpay')).default
      const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret })
      const amount = Math.round(Number(product.price) * 100)
      const order = await rzp.orders.create({
        amount, currency: 'INR', receipt: `sk_${Date.now()}`,
        notes: { productId: product.id, productName: product.name },
      })
      await query(
        `INSERT INTO payments (id, product_id, product_name, image, amount, currency, razorpay_order_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'created')`,
        [uuidv4(), product.id, product.name, product.image, amount, 'INR', order.id]
      )
      return ok({
        keyId, orderId: order.id, amount: order.amount, currency: order.currency,
        product: { id: product.id, name: product.name, image: product.image },
      })
    }

    if (route === '/razorpay/verify' && method === 'POST') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return err('missing fields', 400)
      const secret = process.env.RAZORPAY_KEY_SECRET || ''
      const expected = crypto.createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')
      if (expected !== razorpay_signature) {
        await query(
          `UPDATE payments SET status='failed', verified_at=CURRENT_TIMESTAMP WHERE razorpay_order_id=?`,
          [razorpay_order_id]
        )
        return err('invalid signature', 400)
      }
      await query(
        `UPDATE payments SET status='paid', razorpay_payment_id=?, verified_at=CURRENT_TIMESTAMP WHERE razorpay_order_id=?`,
        [razorpay_payment_id, razorpay_order_id]
      )
      return ok({ ok: true })
    }

    // Upload endpoint (token-protected)
    if (route === '/upload' && method === 'POST') return handleUpload(request)

    // Admin (read-only for MVP)
    if (route === '/admin/custom-orders' && method === 'GET') {
      const rows = await query('SELECT * FROM custom_orders ORDER BY created_at DESC LIMIT 200')
      return ok({ orders: rows })
    }
    if (route === '/admin/uploads' && method === 'GET') {
      const rows = await query('SELECT * FROM uploads ORDER BY created_at DESC LIMIT 200')
      return ok({ uploads: rows })
    }
    if (route === '/admin/newsletter' && method === 'GET') {
      const rows = await query('SELECT email, subscribed_at FROM newsletter ORDER BY subscribed_at DESC LIMIT 500')
      return ok({ subscribers: rows })
    }

    // Health
    if (route === '/health' && method === 'GET') {
      const rows = await query('SELECT 1 AS ok')
      return ok({ ok: true, db: rows?.[0]?.ok === 1, mail: isMailConfigured() })
    }

    return err(`Route ${route} not found`, 404)
  } catch (e) {
    console.error('[api] error:', e)
    return err('Internal server error', 500, { detail: e?.message })
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
