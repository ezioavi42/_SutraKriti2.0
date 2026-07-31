// Shared category catalogue used by:
//   - lib/products.js  (product.category label)
//   - app/api/[[...path]]/route.js  (upload endpoint category validation)
//   - app/admin/page.js  (upload dashboard dropdown)
//   - public/products/<slug>/  folder layout
export const CATEGORIES = [
  { name: 'Handbags',   slug: 'handbags' },
  { name: 'Potli Bags', slug: 'potli-bags' },
  { name: 'Flowers',    slug: 'flowers' },
  { name: 'Home Decor', slug: 'home-decor' },
]

export const CATEGORY_SLUGS = CATEGORIES.map(c => c.slug)
export const UNCATEGORISED = 'uncategorised'

// Map a human name ("Home Decor") or slug ("home-decor") to a slug.
export function toSlug(input) {
  if (!input) return null
  const s = String(input).trim().toLowerCase()
  const bySlug = CATEGORIES.find(c => c.slug === s)
  if (bySlug) return bySlug.slug
  const byName = CATEGORIES.find(c => c.name.toLowerCase() === s)
  if (byName) return byName.slug
  return null
}

// Human-readable name from a slug ("home-decor" → "Home Decor").
export function toName(slug) {
  return CATEGORIES.find(c => c.slug === slug)?.name || null
}
