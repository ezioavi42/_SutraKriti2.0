export function createProductShareUrl(productId, origin) {
  const id = String(productId || '').trim()
  if (!id) throw new Error('A product ID is required to create a share link')

  const url = new URL('/', origin)
  url.searchParams.set('product', id)
  return url.toString()
}

export function getSharedProductId(search) {
  return new URLSearchParams(search).get('product')
}
