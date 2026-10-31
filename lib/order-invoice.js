import fs from 'node:fs/promises'
import path from 'node:path'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 42
const COLOURS = {
  ink: rgb(0.16, 0.13, 0.11),
  muted: rgb(0.43, 0.30, 0.21),
  terracotta: rgb(0.72, 0.42, 0.29),
  beige: rgb(0.91, 0.87, 0.78),
  ivory: rgb(0.98, 0.97, 0.93),
}

function printable(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`
}

function wrapText(value, font, size, maxWidth) {
  const words = printable(value).split(' ').filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function createOrderInvoicePdf(order) {
  const document = await PDFDocument.create()
  const regular = await document.embedFont(StandardFonts.Helvetica)
  const bold = await document.embedFont(StandardFonts.HelveticaBold)
  const logo = await document.embedPng(
    await fs.readFile(path.join(process.cwd(), 'public', 'brand', 'sutrakriti-logo.png'))
  )
  const invoiceNumber = `SK-${String(order.id).slice(0, 8).toUpperCase()}`
  const invoiceDate = new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })
  const items = order.items.filter(item => Number(item.available_quantity) > 0)
  const total = items.reduce((sum, item) => sum + Number(item.unit_price) * Number(item.available_quantity), 0)
  let page
  let y

  const newPage = () => {
    page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    page.drawRectangle({
      x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: COLOURS.ivory,
    })
    const logoSize = logo.scaleToFit(124, 48)
    page.drawImage(logo, {
      x: MARGIN, y: PAGE_HEIGHT - 34 - logoSize.height,
      width: logoSize.width, height: logoSize.height,
    })
    page.drawText('INVOICE', {
      x: 390, y: PAGE_HEIGHT - 53, font: bold, size: 23, color: COLOURS.ink,
    })
    page.drawText(invoiceNumber, {
      x: 390, y: PAGE_HEIGHT - 72, font: regular, size: 10, color: COLOURS.muted,
    })
    page.drawText(`Issued ${invoiceDate}`, {
      x: 390, y: PAGE_HEIGHT - 88, font: regular, size: 9, color: COLOURS.muted,
    })
    page.drawLine({
      start: { x: MARGIN, y: PAGE_HEIGHT - 102 },
      end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 102 },
      thickness: 1, color: COLOURS.beige,
    })
    y = PAGE_HEIGHT - 126
  }

  const drawParagraph = (label, value, x, maxWidth, fontSize = 9) => {
    page.drawText(label.toUpperCase(), {
      x, y, font: bold, size: 8, color: COLOURS.terracotta,
    })
    y -= 15
    for (const line of wrapText(value, regular, fontSize, maxWidth)) {
      page.drawText(line, { x, y, font: regular, size: fontSize, color: COLOURS.ink })
      y -= 13
    }
  }

  newPage()
  const addressTop = y
  drawParagraph('Bill to', `${order.customer_name} ${order.email || ''}`, MARGIN, 220)
  y -= 6
  drawParagraph('Billing address', order.billing_address, MARGIN, 220)
  const leftBottom = y
  y = addressTop
  drawParagraph('Deliver to', order.customer_name, 310, 220)
  y -= 6
  drawParagraph('Delivery address', order.delivery_address, 310, 220)
  y = Math.min(leftBottom, y) - 25

  const tableX = MARGIN
  const columns = { item: tableX, qty: 328, unit: 385, total: 484 }
  const row = (item, quantity, yPosition, header = false) => {
    const color = header ? COLOURS.muted : COLOURS.ink
    const font = header ? bold : regular
    const size = header ? 8 : 9
    page.drawText(header ? 'ITEM' : printable(item.product_name), {
      x: columns.item, y: yPosition, font, size, color,
    })
    page.drawText(header ? 'QTY' : String(quantity), {
      x: columns.qty, y: yPosition, font, size, color,
    })
    page.drawText(header ? 'UNIT PRICE' : money(item.unit_price), {
      x: columns.unit, y: yPosition, font, size, color,
    })
    page.drawText(header ? 'TOTAL' : money(Number(item.unit_price) * quantity), {
      x: columns.total, y: yPosition, font, size, color,
    })
    if (!header && item.colour) {
      page.drawText(`Colour: ${printable(item.colour)}`, {
        x: columns.item, y: yPosition - 12, font: regular, size: 8, color: COLOURS.muted,
      })
    }
  }

  page.drawRectangle({
    x: MARGIN, y: y - 9, width: PAGE_WIDTH - MARGIN * 2, height: 22,
    color: COLOURS.beige,
  })
  row({}, 0, y - 2, true)
  y -= 31

  for (const item of items) {
    if (y < 110) {
      newPage()
      page.drawRectangle({
        x: MARGIN, y: y - 9, width: PAGE_WIDTH - MARGIN * 2, height: 22,
        color: COLOURS.beige,
      })
      row({}, 0, y - 2, true)
      y -= 31
    }
    const quantity = Number(item.available_quantity)
    row(item, quantity, y)
    y -= item.colour ? 33 : 22
    page.drawLine({
      start: { x: MARGIN, y: y + 9 },
      end: { x: PAGE_WIDTH - MARGIN, y: y + 9 },
      thickness: 0.5, color: COLOURS.beige,
    })
  }

  if (y < 95) {
    newPage()
  }
  page.drawText('Payment method: UPI · All listed prices include delivery charges', {
    x: MARGIN, y: y - 4, font: regular, size: 9, color: COLOURS.muted,
  })
  page.drawText(`TOTAL  ${money(total)}`, {
    x: 380, y: y - 4, font: bold, size: 13, color: COLOURS.terracotta,
  })
  page.drawLine({
    start: { x: MARGIN, y: 41 },
    end: { x: PAGE_WIDTH - MARGIN, y: 41 },
    thickness: 1, color: COLOURS.beige,
  })
  page.drawText('Thank you for choosing SutraKriti. Handcrafted with love.', {
    x: MARGIN, y: 26, font: regular, size: 8, color: COLOURS.muted,
  })

  return Buffer.from(await document.save())
}
