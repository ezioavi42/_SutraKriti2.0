import test from 'node:test'
import assert from 'node:assert/strict'
import { createProductShareUrl, getSharedProductId } from '../lib/product-links.js'

test('creates a canonical share URL that identifies the product', () => {
  assert.equal(
    createProductShareUrl('handmade-bag', 'https://sutrakriti.example/some/path?category=bags'),
    'https://sutrakriti.example/?product=handmade-bag'
  )
})

test('encodes product IDs and reads them from shared URLs', () => {
  const shareUrl = createProductShareUrl('product/with spaces', 'https://sutrakriti.example')
  assert.equal(getSharedProductId(new URL(shareUrl).search), 'product/with spaces')
})

test('requires a product ID to create a share URL', () => {
  assert.throws(() => createProductShareUrl('', 'https://sutrakriti.example'), /product ID is required/)
})
