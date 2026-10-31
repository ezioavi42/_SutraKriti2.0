import test from 'node:test'
import assert from 'node:assert/strict'
import { PDFDocument } from 'pdf-lib'
import { createOrderInvoicePdf } from '../lib/order-invoice.js'

test('creates a PDF invoice with an embedded brand logo for accepted quantities', async () => {
  const bytes = await createOrderInvoicePdf({
    id: '12345678-invoice-test',
    customer_name: 'Test Customer',
    billing_address: '1 Billing Street',
    delivery_address: '2 Delivery Street',
    items: [
      { product_name: 'Crochet Flower', colour: 'Mustard', unit_price: 799, available_quantity: 2 },
      { product_name: 'Unavailable Item', unit_price: 100, available_quantity: 0 },
    ],
  })
  const pdf = await PDFDocument.load(bytes)
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-')
  assert.equal(pdf.getPageCount(), 1)
  assert.ok(bytes.length > 10_000)
})
