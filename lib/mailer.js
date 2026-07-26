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

export async function sendMail({ to, subject, html, text, replyTo }) {
  const t = getTransporter()
  if (!t) {
    console.warn('[mailer] SMTP not configured — skipping email:', subject)
    return { ok: false, skipped: true }
  }
  const from = process.env.SMTP_FROM || 'SutraKriti <no-reply@sutrakriti.local>'
  const info = await t.sendMail({ from, to, subject, html, text, replyTo })
  return { ok: true, id: info.messageId }
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
            <strong>UPI</strong> or a <strong>secured payment link</strong>.
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
To reserve materials and start work, we kindly ask for advance payment via UPI or a secured payment link. We will share the exact amount and payment details with you on WhatsApp shortly.

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
