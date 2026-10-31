import nodemailer from 'nodemailer'

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD
  if (!host || !user || !pass) return null
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: { user, pass },
  })
  return transporter
}

export function isMailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)
}

export async function sendMail({ to, subject, html, text, replyTo, from, attachments }) {
  const t = getTransporter()
  if (!t) {
    console.warn('[mailer] SMTP not configured — skipping email:', subject)
    return { ok: false, skipped: true }
  }
  const sender = from || process.env.SMTP_FROM || 'SutraKriti <no-reply@sutrakriti.local>'
  const info = await t.sendMail({ from: sender, to, subject, html, text, replyTo, attachments })
  return { ok: true, id: info.messageId }
}

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]))

const formatOrderMoney = value => `₹${Number(value || 0).toLocaleString('en-IN')}`

function renderStoreOrderItems(items = []) {
  return items.map(item => {
    const quantity = Number(item.available_quantity ?? item.requested_quantity)
    const unitPrice = Number(item.unit_price)
    return {
      name: item.product_name,
      colour: item.colour,
      quantity,
      unitPrice,
      lineTotal: quantity * unitPrice,
      priceUnit: item.price_unit,
    }
  })
}

function storeOrderItemsHtml(items) {
  return renderStoreOrderItems(items).map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #E9DDC7">${escapeHtml(item.name)}${item.colour ? `<br><span style="color:#6D4C36;font-size:12px">Colour: ${escapeHtml(item.colour)}</span>` : ''}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #E9DDC7;text-align:center">${item.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #E9DDC7;text-align:right">${formatOrderMoney(item.unitPrice)}${item.priceUnit ? ` ${escapeHtml(item.priceUnit)}` : ''}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #E9DDC7;text-align:right">${formatOrderMoney(item.lineTotal)}</td>
    </tr>`).join('')
}

function storeOrderItemsText(items) {
  return renderStoreOrderItems(items).map(item =>
    `- ${item.name}${item.colour ? ` (${item.colour})` : ''} — ${item.quantity} × ${formatOrderMoney(item.unitPrice)}${item.priceUnit ? ` ${item.priceUnit}` : ''} = ${formatOrderMoney(item.lineTotal)}`
  ).join('\n')
}

function renderStoreOrderEmailShell({ title, heading, intro, order, items, closing }) {
  const rowsHtml = storeOrderItemsHtml(items)
  const rowsText = storeOrderItemsText(items)
  const total = renderStoreOrderItems(items).reduce((sum, item) => sum + item.lineTotal, 0)
  const invoiceNumber = `SK-${String(order.id).slice(0, 8).toUpperCase()}`
  const addressHtml = `<p style="margin:5px 0"><strong>Delivery address:</strong><br>${escapeHtml(order.delivery_address).replace(/\n/g, '<br>')}</p>
    <p style="margin:12px 0 0"><strong>Billing address:</strong><br>${escapeHtml(order.billing_address).replace(/\n/g, '<br>')}</p>`
  const addressText = `Delivery address:\n${order.delivery_address}\n\nBilling address:\n${order.billing_address}`
  const html = `<!doctype html>
<html><body style="margin:0;padding:32px 12px;background:#F7F1E5;font-family:Georgia,serif;color:#2A211B">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FBF7EE;border:1px solid #E9DDC7;border-radius:16px;overflow:hidden">
      <tr><td style="padding:30px 32px;border-bottom:1px solid #E9DDC7;text-align:center">
        <div style="font-size:11px;letter-spacing:3px;color:#B76A4B;text-transform:uppercase">SutraKriti · ${escapeHtml(title)}</div>
        <h1 style="font-size:30px;margin:10px 0 4px;font-weight:400">${escapeHtml(heading)}</h1>
        <div style="font-size:12px;color:#6D4C36">Order ${escapeHtml(invoiceNumber)}</div>
      </td></tr>
      <tr><td style="padding:26px 32px;font-size:15px;line-height:1.65">
        <p style="margin:0 0 18px">${escapeHtml(intro)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse">
          <thead><tr style="color:#6D4C36;text-align:left">
            <th style="padding:8px;border-bottom:1px solid #B76A4B">Item</th><th style="padding:8px;text-align:center;border-bottom:1px solid #B76A4B">Qty</th><th style="padding:8px;text-align:right;border-bottom:1px solid #B76A4B">Unit</th><th style="padding:8px;text-align:right;border-bottom:1px solid #B76A4B">Total</th>
          </tr></thead><tbody>${rowsHtml}</tbody>
        </table>
        <p style="margin:14px 0;text-align:right"><strong>Order total (delivery included): ${formatOrderMoney(total)}</strong></p>
        <p style="margin:0 0 14px;text-align:right;color:#6D4C36;font-size:12px">All listed product prices include delivery charges.</p>
        <div style="padding:16px;background:#F7F1E5;border-radius:10px;font-size:13px">${addressHtml}</div>
        <p style="margin:20px 0 0">${escapeHtml(closing)}</p>
        <p style="margin:22px 0 0;color:#6D4C36">With warm hands and warmer thread,<br><em>The SutraKriti Studio</em></p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`
  const text = `Dear ${order.customer_name},\n\n${intro}\n\nOrder ${invoiceNumber}\n${rowsText}\n\nOrder total (delivery included): ${formatOrderMoney(total)}\nAll listed product prices include delivery charges.\n\n${addressText}\n\n${closing}\n\nThe SutraKriti Studio`
  return { html, text, total }
}

export function renderStoreOrderAcceptanceEmail(order) {
  const unavailable = order.items.filter(item =>
    Number(item.available_quantity || 0) < Number(item.requested_quantity || 0)
  )
  const partial = unavailable.length > 0
  const intro = partial
    ? `Thank you, ${order.customer_name}. We have received your UPI payment and accepted the available items in your order. The quantities below are confirmed for delivery.`
    : `Thank you, ${order.customer_name}. We have received your UPI payment and accepted your order. The quantities below are confirmed for delivery.`
  const unavailableNote = unavailable.length
    ? `Items not accepted or quantities unavailable: ${unavailable.map(item =>
      `${item.product_name} — ${Number(item.requested_quantity) - Number(item.available_quantity || 0)}`
    ).join('; ')}.`
    : ''
  const rendered = renderStoreOrderEmailShell({
    title: 'Order accepted',
    heading: 'Your order is confirmed.',
    intro,
    order,
    items: order.items.filter(item => Number(item.available_quantity) > 0),
    closing: [unavailableNote, 'We will email you again when your order is ready for delivery. If you have any questions, please reply to this email.'].filter(Boolean).join(' '),
  })
  return { ...rendered, subject: `SutraKriti order accepted · SK-${String(order.id).slice(0, 8).toUpperCase()}` }
}

export function renderStoreOrderReadyEmail(order) {
  const rendered = renderStoreOrderEmailShell({
    title: 'Ready for delivery',
    heading: 'Your order is ready.',
    intro: `Good news, ${order.customer_name} — your order is ready for delivery. Your invoice is attached as a PDF.`,
    order,
    items: order.items.filter(item => Number(item.available_quantity) > 0),
    closing: 'Please reply to this email or contact us on WhatsApp to coordinate delivery.',
  })
  return { ...rendered, subject: `Your SutraKriti order is ready · SK-${String(order.id).slice(0, 8).toUpperCase()}` }
}

export function renderCustomerAcknowledgementEmail(order) {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[m]))
  const whatsapp = process.env.WHATSAPP_NUMBER || ''
  const waHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi SutraKriti — I just submitted a custom order enquiry (${order.name}${order.productType ? ', ' + order.productType : ''}).`)}`
    : '#'

  const rows = [
    ['Product Type', order.productType],
    ['Occasion',     order.occasion],
    ['Colours',      order.colors],
    ['Size',         order.size],
    ['Budget',       order.budget],
  ].filter(([, v]) => v)

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F7F1E5;font-family:Georgia,serif;color:#2A211B">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F1E5;padding:32px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FBF7EE;border:1px solid #E9DDC7;border-radius:16px;overflow:hidden">
        <tr><td style="padding:36px 40px 8px;text-align:center;border-bottom:1px solid #E9DDC7">
          <div style="font-size:11px;letter-spacing:3px;color:#B76A4B;text-transform:uppercase">SutraKriti · Enquiry Received</div>
          <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:32px;margin:10px 0 4px;color:#2A211B;font-weight:400">Thank you, ${esc(order.name || 'friend')}.</h1>
          <p style="margin:8px 0 0;color:#6D4C36;font-size:14px">Your custom enquiry has landed safely in our studio.</p>
        </td></tr>
        <tr><td style="padding:26px 40px;color:#2A211B;font-size:15px;line-height:1.7">
          <p style="margin:0 0 14px">We have received the details you shared and we will personally reach out to you on WhatsApp within <strong>24 hours</strong> to discuss your piece.</p>
          ${rows.length ? `
          <div style="margin:16px 0;padding:16px 20px;background:#F7F1E5;border-radius:10px">
            <div style="font-size:11px;letter-spacing:2px;color:#B76A4B;text-transform:uppercase;margin-bottom:8px">Your enquiry</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${rows.map(([k, v]) => `<tr>
                <td style="padding:4px 0;color:#6D4C36;font-size:12px;letter-spacing:1px;text-transform:uppercase;width:140px;vertical-align:top">${esc(k)}</td>
                <td style="padding:4px 0;color:#2A211B;font-size:15px">${esc(v)}</td>
              </tr>`).join('')}
            </table>
          </div>` : ''}

          <div style="margin:18px 0;padding:16px 20px;background:#F0E7D2;border-radius:10px;color:#3d2f24;font-size:14px;line-height:1.6">
            <div style="font-size:11px;letter-spacing:2px;color:#B76A4B;text-transform:uppercase;margin-bottom:6px">A note on payment</div>
            Once we finalise the design together, payment is made in advance via
            <strong>UPI</strong>, the only supported payment method for now. We share these
            details on our WhatsApp Business account before we begin crafting.
          </div>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px">
            <tr>
              <td style="border-radius:9999px;background:#B76A4B">
                <a href="${waHref}" style="display:inline-block;padding:12px 24px;color:#FBF7EE;font-family:Georgia,serif;font-size:14px;letter-spacing:1px;text-decoration:none">Chat with us on WhatsApp →</a>
              </td>
            </tr>
          </table>

          <p style="margin:22px 0 0;color:#6D4C36;font-size:14px">Every thread, intentional.<br><em>The SutraKriti Studio</em></p>
        </td></tr>
        <tr><td style="padding:18px 40px;background:#E9DDC7;color:#6D4C36;font-size:12px;text-align:center">
          Handcrafted with love, by my mother. · @_sutrakriti
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  const text = `Dear ${order.name || 'friend'},

Thank you for reaching out to SutraKriti. Your custom enquiry has landed safely in our studio.

We will personally reach out to you on WhatsApp within 24 hours to discuss your piece.
${rows.length ? '\nYour enquiry:\n' + rows.map(([k,v]) => `- ${k}: ${v}`).join('\n') : ''}

A NOTE ON PAYMENT
Once we finalise the design together, payment is made in advance via UPI, the only supported payment method for now.
We share these details on our WhatsApp Business account before we begin crafting.

Every thread, intentional.
The SutraKriti Studio
`
  return { html, text, subject: `We received your SutraKriti enquiry · ${order.name || ''}`.trim() }
}


export function renderOrderAcceptanceEmail(order, opts = {}) {
  const whatsapp = process.env.WHATSAPP_NUMBER || ''
  const waHref = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi SutraKriti — regarding my custom order (${order.name}, ${order.productType || 'product'}) that you accepted.`)}`
    : '#'
  const timeline = opts.timeline || '2–4 weeks (we will confirm on WhatsApp)'
  const note = (opts.note || '').trim()
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[m]))

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F7F1E5;font-family:Georgia,serif;color:#2A211B">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F1E5;padding:32px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FBF7EE;border:1px solid #E9DDC7;border-radius:16px;overflow:hidden">
        <tr><td style="padding:36px 40px 8px;text-align:center;border-bottom:1px solid #E9DDC7">
          <div style="font-size:11px;letter-spacing:3px;color:#B76A4B;text-transform:uppercase">SutraKriti · Order Accepted</div>
          <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:34px;margin:10px 0 4px;color:#2A211B;font-weight:400">Your thread has begun.</h1>
          <p style="margin:8px 0 0;color:#6D4C36;font-size:14px">Thank you, ${esc(order.name || 'dear friend')}.</p>
        </td></tr>
        <tr><td style="padding:28px 40px;color:#2A211B;font-size:15px;line-height:1.7">
          <p style="margin:0 0 16px">We are delighted to confirm that we have accepted your custom order for
          <strong>${esc(order.productType || 'a bespoke creation')}</strong>${order.occasion ? ` for your <em>${esc(order.occasion)}</em>` : ''}. It is now in our studio, waiting for its first stitch.</p>
          <p style="margin:0 0 8px"><strong>Estimated timeline:</strong> ${esc(timeline)}</p>
          ${note ? `<p style="margin:0 0 16px;padding:14px 18px;border-left:3px solid #B76A4B;background:#F7F1E5;border-radius:8px;color:#3d2f24"><em>A quiet note from the studio:</em><br>${esc(note).replace(/\n/g,'<br>')}</p>` : ''}

          <div style="margin:20px 0;padding:16px 20px;background:#F0E7D2;border-radius:10px;color:#3d2f24;font-size:14px;line-height:1.6">
            <div style="font-size:11px;letter-spacing:2px;color:#B76A4B;text-transform:uppercase;margin-bottom:6px">Payment</div>
            To reserve materials and start work, we kindly ask for advance payment via
            <strong>UPI</strong>, the only supported payment method for now.
            We will share the exact amount and payment details with you on WhatsApp shortly.
          </div>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 8px">
            <tr>
              <td style="border-radius:9999px;background:#B76A4B">
                <a href="${waHref}" style="display:inline-block;padding:12px 24px;color:#FBF7EE;font-family:Georgia,serif;font-size:14px;letter-spacing:1px;text-decoration:none">Chat on WhatsApp →</a>
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 0;color:#6D4C36;font-size:14px">With warm hands and warmer thread,<br><em>The SutraKriti Studio</em></p>
        </td></tr>
        <tr><td style="padding:18px 40px;background:#E9DDC7;color:#6D4C36;font-size:12px;text-align:center">
          Every thread tells a story. Every creation is crafted with passion.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  const text = `Dear ${order.name || 'friend'},

Thank you for choosing SutraKriti. We are delighted to confirm that we have ACCEPTED your custom order for ${order.productType || 'a bespoke creation'}${order.occasion ? ' for your ' + order.occasion : ''}.

Estimated timeline: ${timeline}
${note ? `\nA note from the studio:\n${note}\n` : ''}
PAYMENT
To reserve materials and start work, we kindly ask for advance payment via UPI, the only supported payment method for now. We will share the exact amount and payment details with you on WhatsApp shortly.

With warm hands and warmer thread,
The SutraKriti Studio
`
  return { html, text, subject: `Your SutraKriti order has been accepted · ${order.name || ''}`.trim() }
}


export function renderCustomOrderEmail(order) {
  const rows = [
    ['Name', order.name],
    ['Contact', order.contact],
    ['Email', order.email || '—'],
    ['Product Type', order.productType || '—'],
    ['Occasion', order.occasion || '—'],
    ['Colours', order.colors || '—'],
    ['Size', order.size || '—'],
    ['Budget', order.budget || '—'],
    ['Reference Image', order.referenceImage || '—'],
    ['Notes', order.notes || '—'],
  ]
  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#F7F1E5;font-family:Georgia,serif;color:#2A211B">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F1E5;padding:32px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#FBF7EE;border:1px solid #E9DDC7;border-radius:16px;overflow:hidden">
        <tr><td style="padding:28px 32px;border-bottom:1px solid #E9DDC7">
          <div style="font-size:11px;letter-spacing:3px;color:#B76A4B;text-transform:uppercase">SutraKriti · New Custom Order</div>
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:28px;margin-top:6px;color:#2A211B">A new thread begins.</div>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${rows.map(([k,v]) => `<tr>
              <td style="padding:10px 0;border-bottom:1px dashed #E9DDC7;color:#6D4C36;font-size:12px;letter-spacing:1px;text-transform:uppercase;width:180px;vertical-align:top">${k}</td>
              <td style="padding:10px 0;border-bottom:1px dashed #E9DDC7;color:#2A211B;font-size:15px">${String(v).replace(/</g,'&lt;')}</td>
            </tr>`).join('')}
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#E9DDC7;color:#6D4C36;font-size:12px">Reply to this email to reach the customer directly. — SutraKriti Studio</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
  const text = `New custom order\n\n` + rows.map(([k,v])=>`${k}: ${v}`).join('\n')
  return { html, text }
}
