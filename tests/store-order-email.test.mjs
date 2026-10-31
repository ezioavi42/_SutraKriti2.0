import test from 'node:test'
import assert from 'node:assert/strict'
import { renderStoreOrderAcceptanceEmail, renderStoreOrderReadyEmail } from '../lib/mailer.js'

const order = {
  id: '12345678-email-test',
  customer_name: 'Test Customer',
  email: 'customer@example.com',
  billing_address: '1 Billing Street',
  delivery_address: '2 Delivery Street',
  items: [{
    product_name: 'Crochet Flower',
    colour: 'Blush',
    unit_price: 799,
    price_unit: 'per Piece',
    requested_quantity: 2,
    available_quantity: 1,
  }, {
    product_name: 'Woven Bag',
    unit_price: 400,
    requested_quantity: 2,
    available_quantity: 0,
  }],
}

test('acceptance email contains final accepted quantity, address, and total', () => {
  const email = renderStoreOrderAcceptanceEmail(order)
  assert.match(email.subject, /order accepted/)
  assert.match(email.text, /Crochet Flower \(Blush\) — 1 × ₹799 per Piece = ₹799/)
  assert.match(email.text, /Delivery address:\n2 Delivery Street/)
  assert.match(email.text, /Order total \(delivery included\): ₹799/)
  assert.match(email.text, /All listed product prices include delivery charges\./)
  assert.match(email.text, /Woven Bag — 2/)
})

test('ready email announces the attached invoice', () => {
  const email = renderStoreOrderReadyEmail(order)
  assert.match(email.subject, /order is ready/)
  assert.match(email.html, /invoice is attached as a PDF/)
  assert.match(email.text, /Crochet Flower/)
})
