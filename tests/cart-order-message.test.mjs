import test from 'node:test'
import assert from 'node:assert/strict'
import { createWhatsAppOrderUrl } from '../lib/cart.js'

test('WhatsApp order message includes order reference and UPI-only request', () => {
  const url = createWhatsAppOrderUrl([{
    productId: 'crochet-flower',
    name: 'Crochet Flower',
    category: 'Flowers',
    colors: ['Mustard', 'Blush'],
    selectedColor: 'Blush',
    quantity: 2,
    price: 799,
    priceUnit: 'per Piece',
  }], { orderReference: 'SK-12345678' })
  const message = new URL(url).searchParams.get('text')
  assert.match(message, /Order reference: SK-12345678/)
  assert.match(message, /Colour: Blush/)
  assert.match(message, /Quantity: 2/)
  assert.match(message, /Unit price \(delivery included\): ₹799 per Piece/)
  assert.match(message, /Line total \(delivery included\): ₹1,598/)
  assert.match(message, /Order total \(delivery included\): ₹1,598/)
  assert.match(message, /All listed product prices and the order total include delivery charges\./)
  assert.match(message, /Please send me the UPI details for payment\. UPI is the only available payment method for now\./)
  assert.doesNotMatch(message, /confirm availability, delivery charges/)
})
