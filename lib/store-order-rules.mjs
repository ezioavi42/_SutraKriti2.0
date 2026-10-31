export function validateStoreOrderReview({
  storedItems,
  submittedItems,
  deliveryAddress,
  billingAddress,
  paymentReceived,
  addressesConfirmed,
  forAcceptance = false,
}) {
  const delivery = String(deliveryAddress || '').trim()
  const billing = String(billingAddress || '').trim()
  if (!delivery || delivery.length > 2000) {
    return { ok: false, status: 400, error: 'delivery address required (maximum 2000 characters)' }
  }
  if (!billing || billing.length > 2000) {
    return { ok: false, status: 400, error: 'billing address required (maximum 2000 characters)' }
  }
  if (!Array.isArray(submittedItems) || submittedItems.length !== storedItems.length) {
    return { ok: false, status: 400, error: 'availability must be set for each order item' }
  }

  const submittedById = new Map()
  for (const line of submittedItems) {
    if (!line || typeof line.id !== 'string' || submittedById.has(line.id)) {
      return { ok: false, status: 400, error: 'invalid availability details' }
    }
    submittedById.set(line.id, line.availableQuantity)
  }

  const items = []
  for (const item of storedItems) {
    if (!submittedById.has(item.id)) {
      return { ok: false, status: 400, error: 'availability must be set for each order item' }
    }
    const rawQuantity = submittedById.get(item.id)
    const availableQuantity = rawQuantity === '' || rawQuantity === null || rawQuantity === undefined
      ? null
      : Number(rawQuantity)
    if (availableQuantity !== null &&
      (!Number.isSafeInteger(availableQuantity) || availableQuantity < 0 ||
        availableQuantity > Number(item.requested_quantity))) {
      return {
        ok: false,
        status: 400,
        error: `available quantity for ${item.product_name} must be between 0 and ${item.requested_quantity}`,
      }
    }
    items.push({ ...item, available_quantity: availableQuantity })
  }

  if (forAcceptance) {
    if (!paymentReceived) {
      return { ok: false, status: 409, error: 'mark UPI payment as received before accepting the order' }
    }
    if (!addressesConfirmed) {
      return { ok: false, status: 409, error: 'review and confirm the delivery and billing addresses before accepting' }
    }
    if (items.some(item => item.available_quantity === null)) {
      return { ok: false, status: 409, error: 'record an available quantity for every item before accepting' }
    }
    if (!items.some(item => item.available_quantity > 0)) {
      return { ok: false, status: 409, error: 'at least one item must be available for delivery' }
    }
  }

  return { ok: true, deliveryAddress: delivery, billingAddress: billing, items }
}
