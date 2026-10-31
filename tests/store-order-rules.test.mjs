import test from 'node:test'
import assert from 'node:assert/strict'
import { validateStoreOrderReview } from '../lib/store-order-rules.mjs'

const storedItems = [
  { id: 'item-a', product_name: 'Crochet flower', requested_quantity: 3 },
  { id: 'item-b', product_name: 'Woven bag', requested_quantity: 2 },
]

function review(overrides = {}) {
  return validateStoreOrderReview({
    storedItems,
    submittedItems: [
      { id: 'item-a', availableQuantity: 3 },
      { id: 'item-b', availableQuantity: 0 },
    ],
    deliveryAddress: 'Delivery address',
    billingAddress: 'Billing address',
    paymentReceived: true,
    addressesConfirmed: true,
    forAcceptance: true,
    ...overrides,
  })
}

test('allows an accepted order when only some requested items are available', () => {
  const result = review()
  assert.equal(result.ok, true)
  assert.deepEqual(result.items.map(item => item.available_quantity), [3, 0])
})

test('requires payment and confirmed addresses before acceptance', () => {
  assert.equal(review({ paymentReceived: false }).error, 'mark UPI payment as received before accepting the order')
  assert.match(review({ addressesConfirmed: false }).error, /confirm the delivery and billing addresses/)
})

test('requires an availability quantity for every line and at least one available item', () => {
  assert.match(review({
    submittedItems: [{ id: 'item-a', availableQuantity: 3 }, { id: 'item-b', availableQuantity: '' }],
  }).error, /every item/)
  assert.match(review({
    submittedItems: [{ id: 'item-a', availableQuantity: 0 }, { id: 'item-b', availableQuantity: 0 }],
  }).error, /at least one item/)
})

test('rejects unknown, duplicate, negative, fractional, and over-request quantities', () => {
  assert.match(review({
    submittedItems: [{ id: 'unknown', availableQuantity: 1 }, { id: 'item-b', availableQuantity: 0 }],
  }).error, /each order item/)
  assert.equal(review({
    submittedItems: [{ id: 'item-a', availableQuantity: 2 }, { id: 'item-a', availableQuantity: 1 }],
  }).error, 'invalid availability details')
  for (const quantity of [-1, 1.5, 4]) {
    assert.match(review({
      submittedItems: [{ id: 'item-a', availableQuantity: quantity }, { id: 'item-b', availableQuantity: 0 }],
    }).error, /available quantity/)
  }
})

test('requires delivery and billing addresses', () => {
  assert.match(review({ deliveryAddress: '   ' }).error, /delivery address required/)
  assert.match(review({ billingAddress: '' }).error, /billing address required/)
})
