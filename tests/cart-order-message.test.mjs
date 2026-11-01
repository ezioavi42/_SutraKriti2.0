import test from 'node:test'
import assert from 'node:assert/strict'
import { addCartProduct, createWhatsAppOrderUrl, formatPostalAddress, isPostalAddressComplete } from '../lib/cart.js'

test('cart quantity defaults to one and collection quantity is added to matching line', () => {
  const product = { id: 'bag', name: 'Crochet Bag', price: 1200, colors: [] }
  const first = addCartProduct([], product, '')
  assert.equal(first[0].quantity, 1)
  const updated = addCartProduct(first, product, '', 3)
  assert.equal(updated.length, 1)
  assert.equal(updated[0].quantity, 4)
})

test('formats structured address fields for saved orders', () => {
  const address = {
    addressLine1: '12 Craft Lane',
    addressLine2: 'Apartment 4',
    city: 'Pune',
    region: 'Maharashtra',
    postalCode: '411001',
    country: 'India',
  }
  assert.equal(isPostalAddressComplete(address), true)
  assert.equal(formatPostalAddress(address), '12 Craft Lane\nApartment 4\nPune, Maharashtra, 411001\nIndia')
  assert.equal(isPostalAddressComplete({ ...address, postalCode: '' }), false)
})

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
  }], {
    orderReference: 'SK-12345678',
    customerName: 'Asha Rao',
    email: 'asha@example.com',
    deliveryAddress: '12 Craft Lane\nPune, Maharashtra, 411001\nIndia',
    billingAddress: '12 Craft Lane\nPune, Maharashtra, 411001\nIndia',
  })
  const message = new URL(url).searchParams.get('text')
  assert.match(message, /Order reference: SK-12345678/)
  assert.match(message, /Name: Asha Rao/)
  assert.match(message, /Email: asha@example\.com/)
  assert.match(message, /Delivery address:\n12 Craft Lane\nPune, Maharashtra, 411001\nIndia/)
  assert.match(message, /Billing address:\n12 Craft Lane\nPune, Maharashtra, 411001\nIndia/)
  assert.equal((message.match(/Name: Asha Rao/g) || []).length, 1)
  assert.equal((message.match(/Email: asha@example\.com/g) || []).length, 1)
  assert.equal((message.match(/Delivery address:/g) || []).length, 1)
  assert.equal((message.match(/Billing address:/g) || []).length, 1)
  assert.match(message, /Colour: Blush/)
  assert.match(message, /Quantity: 2/)
  assert.match(message, /Unit price \(delivery included\): ₹799 per Piece/)
  assert.match(message, /Line total \(delivery included\): ₹1,598/)
  assert.match(message, /Order total \(delivery included\): ₹1,598/)
  assert.match(message, /All listed product prices and the order total include delivery charges\./)
  assert.match(message, /Please send me the UPI details for payment\. UPI is the only available payment method for now\./)
  assert.doesNotMatch(message, /confirm availability, delivery charges/)
})
