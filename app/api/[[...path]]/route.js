import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME || 'sutrakriti')
  }
  return db
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Hardcoded product catalogue (MVP)
const PRODUCTS = [
  { id: 'p-tote-terracotta', name: 'Terracotta Tote Bag', category: 'Handbags', price: 2499, image: 'https://images.pexels.com/photos/10820406/pexels-photo-10820406.jpeg', colors: ['Terracotta','Cream'], description: 'A generous everyday tote hand-crocheted from soft cotton yarn in warm terracotta tones. Reinforced base, roomy interior and heirloom stitching.', material: '100% Cotton Yarn', dimensions: '34 × 32 × 12 cm', care: 'Hand wash cold, reshape while damp, dry flat.', delivery: '7–10 days', new: true },
  { id: 'p-tote-cream', name: 'Ivory Market Tote', category: 'Handbags', price: 2299, image: 'https://images.pexels.com/photos/30224898/pexels-photo-30224898.jpeg', colors: ['Ivory','Beige'], description: 'A soft ivory market tote with an artisanal open weave — light, breathable and effortlessly elegant.', material: 'Cotton & Linen blend', dimensions: '32 × 30 × 10 cm', care: 'Hand wash, dry flat.', delivery: '7–10 days' },
  { id: 'p-potli-gold', name: 'Golden Wedding Potli', category: 'Potli Bags', price: 1899, image: 'https://images.pexels.com/photos/32452334/pexels-photo-32452334.jpeg', colors: ['Gold','Ivory'], description: 'A ceremonial potli with delicate crochet lace and a golden drawstring — perfect for weddings and festive gifting.', material: 'Cotton with gold thread', dimensions: '18 × 22 cm', care: 'Spot clean only.', delivery: '10–14 days', bestseller: true },
  { id: 'p-flowers-bouquet', name: 'Everlasting Rose Bouquet', category: 'Flowers', price: 3499, image: 'https://images.unsplash.com/photo-1645516956968-dee62f4a9090', colors: ['Blush','Sage'], description: 'A bouquet of hand-crocheted roses that never wilt — a keepsake of love, patience and colour.', material: 'Soft acrylic yarn', dimensions: '12 stems, 30 cm', care: 'Dust gently.', delivery: '10–14 days', bestseller: true },
  { id: 'p-flowers-single', name: 'Single Sunflower', category: 'Flowers', price: 799, image: 'https://images.pexels.com/photos/20269075/pexels-photo-20269075.jpeg', colors: ['Mustard','Sage'], description: 'A cheerful single-stem sunflower — a tiny piece of sunshine you can hold forever.', material: 'Cotton yarn', dimensions: '25 cm stem', care: 'Dust gently.', delivery: '5–7 days', new: true },
  { id: 'p-blanket-bouquet', name: 'Bouquet Blanket', category: 'Home Decor', price: 5999, image: 'https://images.unsplash.com/photo-1571434976902-a6e3e1eb0d51', colors: ['Ivory','Terracotta'], description: 'Our signature bouquet blanket — a soft, sculptural throw crocheted flower-by-flower with love.', material: 'Merino wool blend', dimensions: '120 × 150 cm', care: 'Dry clean recommended.', delivery: '3–4 weeks', bestseller: true },
  { id: 'p-blanket-sage', name: 'Sage Throw Blanket', category: 'Home Decor', price: 4499, image: 'https://images.pexels.com/photos/5806996/pexels-photo-5806996.jpeg', colors: ['Sage','Cream'], description: 'A calming sage throw with a modern granny stitch — cozy for the couch, elegant for the bed.', material: 'Wool & Cotton', dimensions: '130 × 160 cm', care: 'Hand wash cold.', delivery: '3–4 weeks' },
  { id: 'p-decor-hoop', name: 'Woven Wall Hoop', category: 'Home Decor', price: 1599, image: 'https://images.pexels.com/photos/18971489/pexels-photo-18971489.jpeg', colors: ['Cream','Brown'], description: 'A textured wall hoop that adds a handcrafted warmth to any room.', material: 'Cotton & Bamboo', dimensions: '30 cm diameter', care: 'Dust gently.', delivery: '7–10 days' },
]

async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'SutraKriti API — Every thread tells a story.' }))
    }

    // Products
    if (route === '/products' && method === 'GET') {
      return handleCORS(NextResponse.json({ products: PRODUCTS }))
    }
    if (route.startsWith('/products/') && method === 'GET') {
      const id = route.split('/')[2]
      const product = PRODUCTS.find(p => p.id === id)
      if (!product) return handleCORS(NextResponse.json({ error: 'not found' }, { status: 404 }))
      return handleCORS(NextResponse.json({ product }))
    }

    // Custom order enquiry
    if (route === '/custom-order' && method === 'POST') {
      const body = await request.json()
      if (!body.name || !body.contact) return handleCORS(NextResponse.json({ error: 'name and contact required' }, { status: 400 }))
      const doc = {
        id: uuidv4(),
        name: body.name,
        contact: body.contact,
        email: body.email || '',
        productType: body.productType || '',
        colors: body.colors || '',
        size: body.size || '',
        budget: body.budget || '',
        occasion: body.occasion || '',
        referenceImage: body.referenceImage || '',
        notes: body.notes || '',
        status: 'new',
        createdAt: new Date(),
      }
      await db.collection('custom_orders').insertOne(doc)
      return handleCORS(NextResponse.json({ ok: true, id: doc.id }))
    }

    // Contact form
    if (route === '/contact' && method === 'POST') {
      const body = await request.json()
      if (!body.name || !body.message) return handleCORS(NextResponse.json({ error: 'name and message required' }, { status: 400 }))
      const doc = { id: uuidv4(), name: body.name, email: body.email || '', message: body.message, createdAt: new Date() }
      await db.collection('contacts').insertOne(doc)
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // Newsletter
    if (route === '/newsletter' && method === 'POST') {
      const body = await request.json()
      if (!body.email) return handleCORS(NextResponse.json({ error: 'email required' }, { status: 400 }))
      await db.collection('newsletter').updateOne(
        { email: body.email },
        { $set: { email: body.email, subscribedAt: new Date() } },
        { upsert: true }
      )
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // Razorpay create order
    if (route === '/razorpay/order' && method === 'POST') {
      const body = await request.json()
      const product = PRODUCTS.find(p => p.id === body.productId)
      if (!product) return handleCORS(NextResponse.json({ error: 'product not found' }, { status: 404 }))

      const keyId = process.env.RAZORPAY_KEY_ID
      const keySecret = process.env.RAZORPAY_KEY_SECRET
      if (!keyId || !keySecret) {
        return handleCORS(NextResponse.json({
          error: 'payment_unconfigured',
          message: 'Online payment is being set up. Please order via WhatsApp for now.',
          whatsappNumber: process.env.WHATSAPP_NUMBER || '',
        }, { status: 503 }))
      }

      const Razorpay = (await import('razorpay')).default
      const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret })
      const amount = Math.round(Number(product.price) * 100)
      const order = await rzp.orders.create({
        amount, currency: 'INR', receipt: `sk_${Date.now()}`,
        notes: { productId: product.id, productName: product.name },
      })

      await db.collection('payments').insertOne({
        id: uuidv4(),
        productId: product.id,
        productName: product.name,
        image: product.image,
        amount,
        currency: 'INR',
        razorpayOrderId: order.id,
        status: 'created',
        createdAt: new Date(),
      })

      return handleCORS(NextResponse.json({
        keyId,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        product: { id: product.id, name: product.name, image: product.image },
      }))
    }

    if (route === '/razorpay/verify' && method === 'POST') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return handleCORS(NextResponse.json({ error: 'missing fields' }, { status: 400 }))
      }
      const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')
      if (expected !== razorpay_signature) {
        await db.collection('payments').updateOne({ razorpayOrderId: razorpay_order_id }, { $set: { status: 'failed', verifiedAt: new Date() } })
        return handleCORS(NextResponse.json({ ok: false, error: 'invalid signature' }, { status: 400 }))
      }
      await db.collection('payments').updateOne(
        { razorpayOrderId: razorpay_order_id },
        { $set: { status: 'paid', razorpayPaymentId: razorpay_payment_id, verifiedAt: new Date() } }
      )
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // Admin (read-only for MVP): list custom orders
    if (route === '/admin/custom-orders' && method === 'GET') {
      const rows = await db.collection('custom_orders').find({}).sort({ createdAt: -1 }).limit(200).toArray()
      const clean = rows.map(({ _id, ...r }) => r)
      return handleCORS(NextResponse.json({ orders: clean }))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (err) {
    console.error('API Error:', err)
    return handleCORS(NextResponse.json({ error: 'Internal server error', detail: err?.message }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
