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
