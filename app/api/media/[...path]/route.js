import fs from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { CATEGORY_SLUGS, UNCATEGORISED } from '@/lib/categories'
import { getUploadRoot } from '@/lib/upload-storage'

const MIME_TYPES = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request, { params }) {
  const { path: parts = [] } = await params
  if (parts.length !== 2 || ![...CATEGORY_SLUGS, UNCATEGORISED].includes(parts[0])) {
    return new NextResponse('Not found', { status: 404 })
  }

  const filename = parts[1]
  if (!filename || filename !== path.basename(filename)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const extension = path.extname(filename).toLowerCase()
  const contentType = MIME_TYPES[extension]
  if (!contentType) return new NextResponse('Not found', { status: 404 })

  const root = getUploadRoot()
  const filePath = path.resolve(root, parts[0], filename)
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const image = await fs.readFile(filePath)
    return new NextResponse(image, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(image.byteLength),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') {
      return new NextResponse('Not found', { status: 404 })
    }
    console.error('[media] image read failed:', error?.message)
    return new NextResponse('Image unavailable', { status: 500 })
  }
}