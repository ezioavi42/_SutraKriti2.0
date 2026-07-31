import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { query, initSchema } from '@/lib/db'
import { sendMail, renderCustomOrderEmail, renderOrderAcceptanceEmail, renderCustomerAcknowledgementEmail, isMailConfigured } from '@/lib/mailer'
import { PRODUCTS } from '@/lib/products'
import { toSlug, CATEGORY_SLUGS, UNCATEGORISED } from '@/lib/categories'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ADMIN_COOKIE = 'sk_admin'
const ADMIN_MAX_AGE = 7 * 24 * 60 * 60 // 7 days

function adminSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || 'change-me'
}
function signAdminToken() {
  const ts = Date.now().toString()
  const sig = crypto.createHmac('sha256', adminSecret()).update(ts).digest('hex')
  return `${ts}.${sig}`
}
function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return false
  const [ts, sig] = token.split('.')
  if (!ts || !sig) return false
  const age = Date.now() - Number(ts)
  if (!Number.isFinite(age) || age < 0 || age > ADMIN_MAX_AGE * 1000) return false
  const exp = crypto.createHmac('sha256', adminSecret()).update(ts).digest('hex')
  try {
    return sig.length === exp.length &&
      crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(exp, 'hex'))
  } catch { return false }
}
function isAdmin(request) {
  const cookie = request.headers.get('cookie') || ''
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`))
  if (!m) return false
  return verifyAdminToken(decodeURIComponent(m[1]))
}

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
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
  // Accept either the shared UPLOAD_TOKEN header OR a valid admin session cookie.
  const token = request.headers.get('x-upload-token') || ''
  const expected = process.env.UPLOAD_TOKEN
  const tokenOk = expected && token === expected
  const adminOk = isAdmin(request)
  if (!tokenOk && !adminOk) return err('unauthorised', 401)

  let form
  try { form = await request.formData() } catch { return err('multipart/form-data required', 400) }
  const file = form.get('file')
  if (!file || typeof file === 'string') return err('file field required', 400)

  // Category may come from form field, query string, or header. It's optional —
  // when omitted the file is stored under `uncategorised/`.
  const url = new URL(request.url)
  const catRaw = form.get('category') || url.searchParams.get('category') || request.headers.get('x-category') || ''
  const category = catRaw ? toSlug(catRaw) : null
  if (catRaw && !category) {
    return err('invalid_category', 400, {
      message: `Unknown category '${catRaw}'.`,
      allowed: [...CATEGORY_SLUGS, UNCATEGORISED],
    })
  }
  const catSlug = category || UNCATEGORISED

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
  const mime = file.type || 'application/octet-stream'
  if (!allowed.includes(mime)) return err(`unsupported mime type: ${mime}`, 415)

  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.byteLength > 8 * 1024 * 1024) return err('file too large (max 8 MB)', 413)

  const uploadRoot = process.env.UPLOAD_DIR || 'public/products'
  const absRoot = path.isAbsolute(uploadRoot) ? uploadRoot : path.join(process.cwd(), uploadRoot)
  const absDir = path.join(absRoot, catSlug)
  await fs.mkdir(absDir, { recursive: true })

  const original = file.name || 'image'
  const ext = (path.extname(original) || '.jpg').toLowerCase()
  const base = slugify(path.basename(original, path.extname(original))) || 'image'
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${base}${ext}`
  const abs = path.join(absDir, filename)
  await fs.writeFile(abs, buf)

  const publicUrl = `/products/${catSlug}/${filename}`
  const id = uuidv4()
  try {
    await query(
      'INSERT INTO uploads (id, filename, url, category, mime, size_bytes) VALUES (?, ?, ?, ?, ?, ?)',
      [id, filename, publicUrl, catSlug, mime, buf.byteLength]
    )
  } catch (e) { console.error('[upload] db insert failed:', e?.message) }

  return ok({ ok: true, id, filename, url: publicUrl, category: catSlug, size: buf.byteLength, mime })
}

async function handleRoute(request, { params }) {
  const { path: parts = [] } = await params
  const route = `/${parts.join('/')}`
  const method = request.method

  // Routes that must work even if the database is temporarily unreachable
  const dbOptional = new Set(['/', '/products'])
  const isProductDetail = route.startsWith('/products/')

  try {
    if (!(dbOptional.has(route) || isProductDetail)) {
      await initSchema()
    } else {
      // best-effort schema init; ignore failure
      try { await initSchema() } catch (e) { console.warn('[api] initSchema deferred:', e?.code || e?.message) }
    }

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

    // Custom order enquiry -> MySQL + email (studio) + acknowledgement (customer)
    if (route === '/custom-order' && method === 'POST') {
      const body = await request.json()
      if (!body.name || !body.contact) return err('name and contact required', 400)
      if (!body.email) return err('email required', 400, { message: 'Email is required so we can send you an acknowledgement.' })
      if (!/^\S+@\S+\.\S+$/.test(String(body.email))) return err('invalid email', 400)

      const id = uuidv4()
      await query(
        `INSERT INTO custom_orders
          (id, name, contact, email, product_type, colors, size, budget, occasion, reference_image, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, body.name, body.contact, body.email, body.productType || null,
         body.colors || null, body.size || null, body.budget || null, body.occasion || null,
         body.referenceImage || null, body.notes || null]
      )

      let studioEmailStatus = 'skipped'
      let customerEmailStatus = 'skipped'

      if (isMailConfigured()) {
        // 1) Notify the studio
        try {
          const to = process.env.ORDERS_EMAIL || process.env.BRAND_EMAIL || ''
          if (to) {
            const { html, text } = renderCustomOrderEmail(body)
            const r = await sendMail({
              to,
              subject: `New Custom Order · ${body.name}${body.productType ? ' · ' + body.productType : ''}`,
              html, text,
              replyTo: body.email || undefined,
            })
            studioEmailStatus = r.ok ? 'sent' : 'failed'
          }
        } catch (e) {
          console.error('[custom-order] studio email failed:', e?.message)
          studioEmailStatus = 'failed'
        }

        // 2) Acknowledge the customer
        try {
          const { html, text, subject } = renderCustomerAcknowledgementEmail(body)
          const r = await sendMail({
            to: body.email,
            subject,
            html,
            text,
            replyTo: process.env.ORDERS_EMAIL || undefined,
          })
          customerEmailStatus = r.ok ? 'sent' : 'failed'
        } catch (e) {
          console.error('[custom-order] customer email failed:', e?.message)
          customerEmailStatus = 'failed'
        }
      }

      return ok({ ok: true, id, emailStatus: studioEmailStatus, customerEmailStatus })
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

    // ---------------- Admin ----------------
    // Login
    if (route === '/admin/login' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const expected = process.env.ADMIN_PASSWORD
      if (!expected) return err('admin_not_configured', 500, {
        message: 'ADMIN_PASSWORD is not set on the server.'
      })
      if (!body.password || body.password !== expected) return err('invalid_credentials', 401)
      const token = signAdminToken()
      const res = ok({ ok: true })
      const isHttps = (process.env.NEXT_PUBLIC_BASE_URL || '').startsWith('https://')
      res.headers.set('Set-Cookie',
        `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ADMIN_MAX_AGE}${isHttps ? '; Secure' : ''}`
      )
      return res
    }
    if (route === '/admin/logout' && method === 'POST') {
      const res = ok({ ok: true })
      res.headers.set('Set-Cookie', `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
      return res
    }
    if (route === '/admin/me' && method === 'GET') {
      if (!isAdmin(request)) return err('unauthorised', 401)
      return ok({ authenticated: true })
    }

    // Every other /admin/* route requires auth
    if (route.startsWith('/admin/')) {
      if (!isAdmin(request)) return err('unauthorised', 401)

      if (route === '/admin/stats' && method === 'GET') {
        const [orders] = await Promise.all([
          query(`SELECT
              COUNT(*) AS total,
              SUM(status='new') AS pending,
              SUM(status='accepted') AS accepted,
              SUM(status='completed') AS completed
            FROM custom_orders`),
        ])
        const [uploads] = await query('SELECT COUNT(*) AS n FROM uploads').then(r => [r])
        const [subs]    = await query('SELECT COUNT(*) AS n FROM newsletter').then(r => [r])
        const [contacts]= await query('SELECT COUNT(*) AS n FROM contacts').then(r => [r])
        const [payments]= await query(`SELECT COUNT(*) AS n, COALESCE(SUM(status='paid'),0) AS paid FROM payments`).then(r => [r])
        const recent = await query('SELECT id, name, product_type, occasion, status, created_at FROM custom_orders ORDER BY created_at DESC LIMIT 5')
        return ok({
          orders: orders?.[0] || { total: 0, pending: 0, accepted: 0, completed: 0 },
          uploads: Number(uploads?.[0]?.n || 0),
          newsletter: Number(subs?.[0]?.n || 0),
          contacts: Number(contacts?.[0]?.n || 0),
          payments: payments?.[0] || { n: 0, paid: 0 },
          recent,
        })
      }

      if (route === '/admin/custom-orders' && method === 'GET') {
        const url = new URL(request.url)
        const status = url.searchParams.get('status')
        const rows = status && status !== 'all'
          ? await query('SELECT * FROM custom_orders WHERE status=? ORDER BY created_at DESC LIMIT 500', [status])
          : await query('SELECT * FROM custom_orders ORDER BY created_at DESC LIMIT 500')
        return ok({ orders: rows })
      }

      // Order actions: accept | complete | reopen | note
      // POST /admin/custom-orders/:id/action  { action, note?, timeline?, sendEmail? }
      const mAction = route.match(/^\/admin\/custom-orders\/([^/]+)\/action$/)
      if (mAction && method === 'POST') {
        const id = mAction[1]
        const body = await request.json().catch(() => ({}))
        const action = String(body.action || '').toLowerCase()
        const rows = await query('SELECT * FROM custom_orders WHERE id=?', [id])
        if (!rows.length) return err('order not found', 404)
        const order = rows[0]

        let newStatus = order.status, emailStatus = 'skipped', emailError = null
        if (action === 'accept') {
          newStatus = 'accepted'
          await query(
            `UPDATE custom_orders SET status='accepted', accepted_at=CURRENT_TIMESTAMP, admin_note=COALESCE(?, admin_note) WHERE id=?`,
            [body.note ?? null, id]
          )
          if (body.sendEmail !== false) {
            if (!order.email) {
              emailStatus = 'no_email'
            } else if (!isMailConfigured()) {
              emailStatus = 'smtp_not_configured'
            } else {
              try {
                const orderCamel = {
                  name: order.name, email: order.email, contact: order.contact,
                  productType: order.product_type, occasion: order.occasion,
                  colors: order.colors, size: order.size,
                }
                const { html, text, subject } = renderOrderAcceptanceEmail(orderCamel, {
                  timeline: body.timeline || undefined,
                  note: body.note || undefined,
                })
                const r = await sendMail({ to: order.email, subject, html, text, replyTo: process.env.ORDERS_EMAIL })
                emailStatus = r.ok ? 'sent' : 'failed'
                if (r.ok) {
                  await query('UPDATE custom_orders SET acceptance_email_sent_at=CURRENT_TIMESTAMP WHERE id=?', [id])
                }
              } catch (e) {
                emailStatus = 'failed'; emailError = e?.message
                console.error('[admin] acceptance email failed:', e)
              }
            }
          }
        } else if (action === 'complete') {
          newStatus = 'completed'
          await query(
            `UPDATE custom_orders SET status='completed', completed_at=CURRENT_TIMESTAMP, admin_note=COALESCE(?, admin_note) WHERE id=?`,
            [body.note ?? null, id]
          )
        } else if (action === 'reopen') {
          newStatus = 'new'
          await query(
            `UPDATE custom_orders SET status='new', accepted_at=NULL, completed_at=NULL WHERE id=?`,
            [id]
          )
        } else if (action === 'note') {
          await query(`UPDATE custom_orders SET admin_note=? WHERE id=?`, [body.note ?? null, id])
        } else {
          return err('invalid action', 400)
        }
        const [updated] = await query('SELECT * FROM custom_orders WHERE id=?', [id])
        return ok({ ok: true, order: updated, status: newStatus, emailStatus, emailError })
      }

      if (route === '/admin/uploads' && method === 'GET') {
        const rows = await query('SELECT * FROM uploads ORDER BY created_at DESC LIMIT 500')
        return ok({ uploads: rows })
      }
      const mDelUpload = route.match(/^\/admin\/uploads\/([^/]+)$/)
      if (mDelUpload && method === 'DELETE') {
        const id = mDelUpload[1]
        const rows = await query('SELECT * FROM uploads WHERE id=?', [id])
        if (!rows.length) return err('upload not found', 404)
        const u = rows[0]
        try {
          const uploadRoot = process.env.UPLOAD_DIR || 'public/products'
          const absRoot = path.isAbsolute(uploadRoot) ? uploadRoot : path.join(process.cwd(), uploadRoot)
          // Support both new category folders and legacy top-level files
          const rel = String(u.url || '').replace(/^\/products\//, '')
          const target = rel ? path.join(absRoot, rel) : path.join(absRoot, u.filename)
          await fs.unlink(target)
        } catch (e) { console.warn('[admin] file delete failed:', e?.message) }
        await query('DELETE FROM uploads WHERE id=?', [id])
        return ok({ ok: true })
      }

      if (route === '/admin/contacts' && method === 'GET') {
        const rows = await query('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 500')
        return ok({ contacts: rows })
      }
      if (route === '/admin/newsletter' && method === 'GET') {
        const rows = await query('SELECT email, subscribed_at FROM newsletter ORDER BY subscribed_at DESC LIMIT 1000')
        return ok({ subscribers: rows })
      }
      if (route === '/admin/payments' && method === 'GET') {
        const rows = await query('SELECT * FROM payments ORDER BY created_at DESC LIMIT 500')
        return ok({ payments: rows })
      }

      return err(`Admin route ${route} not found`, 404)
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
