'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import SiteImage from '@/components/site-image'
import {
  CART_STORAGE_KEY, cartIsOrderable, formatCurrency, formatPostalAddress, isPostalAddressComplete,
  readCart, writeCart,
} from '@/lib/cart'

const EMPTY_ADDRESS = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
  country: 'India',
}

function AddressFields({ type, title, value, onChange }) {
  const update = (key, nextValue) => onChange(current => ({ ...current, [key]: nextValue }))
  const autocomplete = field => `${type} ${field}`
  const inputClass = 'mt-1 h-11 w-full rounded-lg border border-beige bg-cream px-3 text-sm text-charcoal'
  const fields = [
    { key: 'addressLine1', label: 'Address line 1', auto: 'address-line1', required: true, wide: true },
    { key: 'addressLine2', label: 'Apartment, suite, unit (optional)', auto: 'address-line2', required: false, wide: true },
    { key: 'city', label: 'City', auto: 'address-level2', required: true },
    { key: 'region', label: 'State / province', auto: 'address-level1', required: true },
    { key: 'postalCode', label: 'Postal code', auto: 'postal-code', required: true },
    { key: 'country', label: 'Country', auto: 'country-name', required: true },
  ]

  return (
    <fieldset className="space-y-3">
      <legend className="font-serif text-xl text-charcoal">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(field => (
          <label key={field.key} className={`block text-xs text-charcoal/70 ${field.wide ? 'sm:col-span-2' : ''}`}>
            {field.label}{field.required && <span className="text-red-600"> *</span>}
            <input
              type="text"
              autoComplete={autocomplete(field.auto)}
              maxLength={field.key === 'addressLine1' || field.key === 'addressLine2' ? 255 : 128}
              required={field.required}
              value={value[field.key]}
              onChange={event => update(field.key, event.target.value)}
              className={inputClass}
              data-testid={`${type}-${field.key}`}
            />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function CartPage() {
  const [cart, setCart] = useState([])
  const [ready, setReady] = useState(false)
  const [cartError, setCartError] = useState('')
  const [orderError, setOrderError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [orderSubmission, setOrderSubmission] = useState(null)
  const [customer, setCustomer] = useState({
    customerName: '',
    email: '',
  })
  const [deliveryAddress, setDeliveryAddress] = useState({ ...EMPTY_ADDRESS })
  const [billingAddress, setBillingAddress] = useState({ ...EMPTY_ADDRESS })
  const [billingSameAsDelivery, setBillingSameAsDelivery] = useState(true)

  useEffect(() => {
    try {
      setCart(readCart())
      setReady(true)
    } catch (error) {
      setCartError(error.message || 'Unable to load your cart')
      setReady(true)
    }
  }, [])

  const persist = nextCart => {
    try {
      writeCart(nextCart)
      setCart(nextCart)
      setCartError('')
    } catch (error) {
      setCartError(error.message || 'Unable to save your cart')
    }
  }

  const subtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * (Number(item.quantity) || 0), 0),
    [cart]
  )
  const canOrder = cartIsOrderable(cart)
  const customerDetailsValid = Boolean(
    customer.customerName.trim() && customer.email.trim() && isPostalAddressComplete(deliveryAddress) &&
    (billingSameAsDelivery || isPostalAddressComplete(billingAddress))
  )

  const resetCart = () => {
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY)
      writeCart([])
      setCart([])
      setCartError('')
    } catch (error) {
      setCartError(error.message || 'Unable to clear your cart')
    }
  }

  const submitOrder = async event => {
    event.preventDefault()
    if (!canOrder || submitting) return
    if (!customerDetailsValid) {
      setOrderError('Complete your name, email, and required address fields.')
      return
    }
    const whatsappWindow = window.open('about:blank', '_blank')
    if (whatsappWindow) whatsappWindow.opener = null
    setSubmitting(true)
    setOrderError('')
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.customerName.trim(),
          email: customer.email.trim(),
          deliveryAddress: formatPostalAddress(deliveryAddress),
          billingAddress: formatPostalAddress(billingSameAsDelivery ? deliveryAddress : billingAddress),
          billingAddressSameAsDelivery: billingSameAsDelivery,
          items: cart.map(item => ({
            productId: item.productId,
            selectedColor: item.selectedColor,
            quantity: Number(item.quantity),
          })),
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.whatsappUrl) {
        throw new Error(result.message || result.error || 'Unable to save your order. Please try again.')
      }

      const reference = `SK-${String(result.id).slice(0, 8).toUpperCase()}`
      setOrderSubmission({ reference, whatsappUrl: result.whatsappUrl })
      if (whatsappWindow && !whatsappWindow.closed) {
        try {
          whatsappWindow.location.href = result.whatsappUrl
        } catch {
          setOrderError('Your order was saved. Use the WhatsApp link below to continue.')
        }
      } else {
        setOrderError('Your order was saved. Use the WhatsApp link below to continue.')
      }
      setCart([])
      setCustomer({ customerName: '', email: '' })
      setDeliveryAddress({ ...EMPTY_ADDRESS })
      setBillingAddress({ ...EMPTY_ADDRESS })
      setBillingSameAsDelivery(true)
      try {
        writeCart([])
      } catch {
        setOrderError('Your order was saved, but this browser could not clear the local cart.')
      }
    } catch (error) {
      if (whatsappWindow && !whatsappWindow.closed) whatsappWindow.close()
      setOrderError(error.message || 'Unable to save your order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-cream text-charcoal">
      <header className="border-b border-beige bg-ivory">
        <div className="container flex min-h-16 items-center justify-between gap-4 py-3">
          <a href="/#catalogue" className="inline-flex items-center gap-2 text-sm text-charcoal/75 hover:text-charcoal">
            <ArrowLeft className="h-4 w-4" /> Continue shopping
          </a>
          <a href="/" aria-label="SutraKriti home" className="inline-flex h-12 w-12 items-center justify-center">
            <SiteImage
              src="/brand/sutrakriti-logo.png"
              alt="SutraKriti"
              width={96}
              height={96}
              className="h-full w-full object-contain"
            />
          </a>
        </div>
      </header>

      <div className="container max-w-5xl py-10 md:py-16">
        <div className="mb-8">
          <span className="text-[11px] tracking-[0.3em] uppercase text-terracotta">Your selection</span>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">Shopping cart</h1>
          <p className="mt-2 text-sm text-charcoal/60">Review colours and enter a quantity for every product before continuing to WhatsApp.</p>
        </div>

        {cartError && (
          <div role="alert" className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            {cartError}
            {cart.length === 0 && <button type="button" onClick={resetCart} className="ml-3 underline">Clear saved cart</button>}
          </div>
        )}
        {orderSubmission && (
          <div role="status" className="mb-5 rounded-xl border border-sage/40 bg-ivory p-4 text-sm text-charcoal">
            <div className="font-medium">Order {orderSubmission.reference} has been saved.</div>
            <p className="mt-1 text-charcoal/60">Continue to WhatsApp to share your order and receive UPI details.</p>
            <a href={orderSubmission.whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 items-center rounded-full bg-[#25D366] px-5 text-sm text-white">
              Open WhatsApp
            </a>
          </div>
        )}

        {!ready ? (
          <div className="rounded-2xl border border-beige bg-ivory p-8 text-charcoal/60">Loading your cart…</div>
        ) : cart.length === 0 ? (
          <div className="rounded-2xl border border-beige bg-ivory p-8 text-center md:p-12">
            <ShoppingBag className="mx-auto h-10 w-10 text-terracotta" />
            <h2 className="mt-4 font-serif text-2xl">Your cart is empty</h2>
            <p className="mt-2 text-sm text-charcoal/60">Choose a product and add it to your cart to begin an order.</p>
            <a href="/#catalogue" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-terracotta px-6 text-sm text-white hover:bg-[color:var(--sk-terracotta-dark)]">
              Explore products
            </a>
          </div>
        ) : (
          <form onSubmit={submitOrder} className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section aria-label="Cart items" className="space-y-4">
              {cart.map((item, index) => {
                const quantity = Number(item.quantity) || 0
                const quantityValid = Number.isSafeInteger(quantity) && quantity >= 1
                const colorValid = item.colors.length <= 1 || item.colors.includes(item.selectedColor)
                return (
                  <article key={item.key} className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-2xl border border-beige bg-ivory p-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-5" data-testid={`cart-item-${index}`}>
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-beige/40">
                      {item.image && <SiteImage src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/50">{item.category || 'SutraKriti'}</div>
                          <h2 className="mt-1 break-words font-serif text-xl">{item.name}</h2>
                          <div className="mt-1 text-sm text-terracotta">{formatCurrency(item.price)}{item.priceUnit ? ` ${item.priceUnit}` : ''}</div>
                          <div className="text-[11px] text-charcoal/55">Delivery included</div>
                        </div>
                        <button type="button" onClick={() => persist(cart.filter(line => line.key !== item.key))} aria-label={`Remove ${item.name} from cart`} className="rounded-full p-2 text-charcoal/50 hover:bg-beige hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {item.colors.length > 1 ? (
                          <label className="block text-xs text-charcoal/70">
                            Colour <span className="text-red-600">*</span>
                            <select
                              required
                              value={item.selectedColor || ''}
                              onChange={event => persist(cart.map(line => line.key === item.key ? { ...line, selectedColor: event.target.value } : line))}
                              className="mt-1 h-11 w-full rounded-lg border border-beige bg-cream px-3 text-sm text-charcoal"
                              data-testid={`cart-color-${index}`}
                            >
                              <option value="" disabled>Choose a colour</option>
                              {item.colors.map(color => <option key={color} value={color}>{color}</option>)}
                            </select>
                          </label>
                        ) : (
                          <div className="text-xs text-charcoal/70">
                            Colour
                            <div className="mt-1 flex h-11 items-center text-sm text-charcoal">{item.colors[0] || 'As shown'}</div>
                          </div>
                        )}
                        <label className="block text-xs text-charcoal/70">
                          Quantity <span className="text-red-600">*</span>
                          <div className="mt-1 flex h-11 items-center rounded-lg border border-beige bg-cream">
                            <button type="button" aria-label={`Decrease ${item.name} quantity`} disabled={!quantityValid || quantity <= 1} onClick={() => persist(cart.map(line => line.key === item.key ? { ...line, quantity: quantity - 1 } : line))} className="flex h-full w-10 items-center justify-center text-charcoal/70 disabled:opacity-30">
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required
                              inputMode="numeric"
                              value={item.quantity}
                              onChange={event => persist(cart.map(line => line.key === item.key ? { ...line, quantity: event.target.value === '' ? '' : Number(event.target.value) } : line))}
                              aria-label={`Quantity for ${item.name}`}
                              className="h-full min-w-0 flex-1 border-x border-beige bg-transparent text-center text-sm"
                              data-testid={`cart-quantity-${index}`}
                            />
                            <button type="button" aria-label={`Increase ${item.name} quantity`} disabled={!quantityValid} onClick={() => persist(cart.map(line => line.key === item.key ? { ...line, quantity: quantity + 1 } : line))} className="flex h-full w-10 items-center justify-center text-charcoal/70 disabled:opacity-30">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          {!quantityValid && <span className="mt-1 block text-[11px] text-red-600">Enter a whole quantity of at least 1.</span>}
                          {!colorValid && <span className="mt-1 block text-[11px] text-red-600">Choose a colour before ordering.</span>}
                        </label>
                      </div>
                      <div className="mt-3 text-right text-sm font-medium text-charcoal">
                        Line total (delivery included): {quantityValid ? formatCurrency(item.price * quantity) : 'Enter quantity'}
                      </div>
                    </div>
                  </article>
                )
              })}
            </section>

            <aside className="h-fit rounded-2xl border border-beige bg-ivory p-5 lg:sticky lg:top-6">
              <h2 className="font-serif text-2xl">Order summary</h2>
              <div className="mt-4 flex justify-between border-t border-beige pt-4 text-sm">
                <span>Order total (delivery included)</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-charcoal/60">All product prices and this total include delivery charges. We will confirm availability and the expected delivery time on WhatsApp.</p>
              <div className="mt-5 rounded-xl border border-terracotta/20 bg-cream p-4">
                <div className="text-sm font-medium text-charcoal">Payment: UPI only for now</div>
                <p className="mt-1 text-xs leading-relaxed text-charcoal/60">
                  We will send the UPI payment details on WhatsApp after you place your order.
                </p>
              </div>
              <div className="mt-5 space-y-3">
                <h3 className="font-serif text-xl">Details for your order</h3>
                <p className="text-xs leading-relaxed text-charcoal/60">
                  Required to send your final order details and invoice by email.
                </p>
                <label className="block text-xs text-charcoal/70">
                  Full name <span className="text-red-600">*</span>
                  <input
                    type="text"
                    autoComplete="name"
                    maxLength={255}
                    required
                    value={customer.customerName}
                    onChange={event => setCustomer({ ...customer, customerName: event.target.value })}
                    className="mt-1 h-11 w-full rounded-lg border border-beige bg-cream px-3 text-sm text-charcoal"
                  />
                </label>
                <label className="block text-xs text-charcoal/70">
                  Email address <span className="text-red-600">*</span>
                  <input
                    type="email"
                    autoComplete="email"
                    maxLength={255}
                    required
                    value={customer.email}
                    onChange={event => setCustomer({ ...customer, email: event.target.value })}
                    className="mt-1 h-11 w-full rounded-lg border border-beige bg-cream px-3 text-sm text-charcoal"
                  />
                </label>
                <AddressFields
                  type="shipping"
                  title="Delivery address"
                  value={deliveryAddress}
                  onChange={setDeliveryAddress}
                />
                <label className="flex items-start gap-2 rounded-lg border border-beige bg-cream p-3 text-sm text-charcoal/80">
                  <input
                    type="checkbox"
                    checked={billingSameAsDelivery}
                    onChange={event => {
                      const same = event.target.checked
                      if (!same) setBillingAddress({ ...deliveryAddress })
                      setBillingSameAsDelivery(same)
                    }}
                    className="mt-0.5 h-4 w-4 accent-[color:var(--sk-terracotta)]"
                    data-testid="billing-same-as-delivery"
                  />
                  <span>Billing address is the same as delivery address</span>
                </label>
                {!billingSameAsDelivery && (
                  <AddressFields
                    type="billing"
                    title="Billing address"
                    value={billingAddress}
                    onChange={setBillingAddress}
                  />
                )}
              </div>
              {orderError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-800">{orderError}</p>}
              <button
                type="submit"
                disabled={!canOrder || submitting}
                className={`mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed ${canOrder && !submitting ? 'bg-[#25D366] text-white hover:bg-[#1fb95a]' : 'bg-charcoal/20 text-charcoal/50'}`}
                data-testid="cart-whatsapp-order"
              >
                {submitting ? 'Saving order…' : 'Place order on WhatsApp'} <MessageCircle className="ml-2 h-4 w-4" />
              </button>
              {!canOrder && <p className="mt-2 text-center text-[11px] text-charcoal/60">Enter a quantity and select a colour for every product.</p>}
              <button type="button" onClick={resetCart} className="mt-4 w-full text-center text-xs text-charcoal/50 underline hover:text-red-600">Clear cart</button>
            </aside>
          </form>
        )}
      </div>
    </main>
  )
}
