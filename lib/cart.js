export const CART_STORAGE_KEY = 'sutrakriti-cart-v1'
export const WHATSAPP_NUMBER = '917777932385'

export function readCart() {
  const raw = window.localStorage.getItem(CART_STORAGE_KEY)
  if (!raw) return []
  const cart = JSON.parse(raw)
  if (!Array.isArray(cart) || cart.some(item =>
    !item || typeof item.key !== 'string' || typeof item.productId !== 'string' ||
    typeof item.name !== 'string' || !Number.isFinite(item.price) || item.price < 0 ||
    !Array.isArray(item.colors) || item.colors.some(color => typeof color !== 'string') ||
    typeof item.selectedColor !== 'string' ||
    !(item.quantity === '' || (Number.isSafeInteger(item.quantity) && item.quantity >= 1))
  )) {
    throw new Error('Saved cart data is invalid')
  }
  return cart
}

export function writeCart(cart) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event('sutrakriti-cart-updated'))
}

export function addCartProduct(cart, product, selectedColor) {
  const colors = Array.isArray(product.colors) ? product.colors : []
  if (colors.length > 1 && !colors.includes(selectedColor)) {
    throw new Error('Choose a product colour before adding it to your cart')
  }
  const color = colors.length === 1 ? colors[0] : (selectedColor || '')
  const key = JSON.stringify([product.id, color])
  const existing = cart.find(item => item.productId === product.id && item.selectedColor === color)
  if (existing) {
    const quantity = Number(existing.quantity)
    if (Number.isSafeInteger(quantity) && quantity > 0) {
      return cart.map(item => item.key === existing.key ? { ...item, quantity: quantity + 1 } : item)
    }
    return cart
  }
  return [
    ...cart,
    {
      key,
      productId: product.id,
      name: product.name,
      category: product.category || '',
      price: Number(product.price) || 0,
      image: product.image || product.images?.[0] || '',
      colors,
      selectedColor: color,
      priceUnit: product.perPiece ? 'per Piece' : product.perPair ? 'per Pair' : product.perBouquet ? 'per Bouquet' : '',
      quantity: '',
    },
  ]
}

export function cartItemCount(cart) {
  return cart.length
}

export function cartItemQuantityIsValid(quantity) {
  return Number.isSafeInteger(Number(quantity)) && Number(quantity) >= 1
}

export function cartIsOrderable(cart) {
  return cart.length > 0 && cart.every(item =>
    cartItemQuantityIsValid(item.quantity) &&
    (item.colors.length <= 1 || item.colors.includes(item.selectedColor))
  )
}

export function formatCurrency(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

export function createWhatsAppOrderUrl(cart, { orderReference = '' } = {}) {
  if (!cartIsOrderable(cart)) throw new Error('Enter a quantity and choose a colour for every cart item')

  const lines = cart.map((item, index) => {
    const quantity = Number(item.quantity)
    const total = item.price * quantity
    return [
      `${index + 1}. ${item.name}`,
      `   Product ID: ${item.productId}`,
      item.category ? `   Category: ${item.category}` : null,
      item.colors.length ? `   Colour: ${item.selectedColor || item.colors[0]}` : null,
      `   Quantity: ${quantity}`,
      `   Unit price (delivery included): ${formatCurrency(item.price)}${item.priceUnit ? ` ${item.priceUnit}` : ''}`,
      `   Line total (delivery included): ${formatCurrency(total)}`,
    ].filter(Boolean).join('\n')
  })
  const orderTotal = cart.reduce((total, item) => total + item.price * Number(item.quantity), 0)
  const message = [
    'Hello SutraKriti, I would like to place this order:',
    orderReference ? `Order reference: ${orderReference}` : null,
    '',
    ...lines,
    '',
    `Order total (delivery included): ${formatCurrency(orderTotal)}`,
    '',
    'All listed product prices and the order total include delivery charges.',
    'Please send me the UPI details for payment. UPI is the only available payment method for now.',
    'Please confirm availability and the expected delivery time.',
    '',
    'Thank you!',
  ].filter(line => line !== null).join('\n')
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
