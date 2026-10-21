# SutraKriti — Product Images (organised by category)

This folder holds hand-uploaded product images for the SutraKriti catalogue.
Files inside these folders are served publicly at:

```
/products/<category-slug>/<filename>
```

## Folder layout

```
public/products/
├── handbags/       # Category: Handbags
├── potli-bags/     # Category: Potli Bags
├── flowers/        # Category: Flowers
├── home-decor/     # Category: Home Decor
├── accessories/    # Category: Accessories
└── uncategorised/  # Files uploaded without a category
```

The canonical list of categories lives in `/lib/categories.js`. Add a new
category there once; the admin upload dropdown, product form, upload API, and
storefront category filters use that list. Admin uploads create the matching
folder automatically. Create a folder manually only when placing files by SFTP.
Uploaded files are served through `/api/media/<category-slug>/<filename>` so
files written after a build load correctly in regular and standalone Next.js
mode. Relative `UPLOAD_DIR` values resolve from the project root.

## Three ways to add images

### 1. Manual drag & drop / SFTP
Drop `.jpg / .webp / .png / .avif` files into the appropriate category folder.
They become available immediately at `/products/<slug>/<filename>`.

Use that URL in the product's **Images** field in `/admin` → **Products**.

Recommended: **1200 × 1500 px (4:5 portrait)**, WebP or high-quality JPEG,
under 500 KB, colour-graded warm.

The admin, API, and CLI upload paths accept images up to 8 MB and automatically
resize JPEG, PNG, WebP, and AVIF inputs to fit 1600 × 2000 before saving WebP
at quality 82. GIFs are retained unchanged to preserve animation. Next.js
serves responsive WebP variants and caches them in `.next/cache/images`; the
production app must be able to write to that directory. For manual SFTP uploads,
compress and resize images before placing them in the category folder.

### 2. API upload
```bash
curl -X POST "$NEXT_PUBLIC_BASE_URL/api/upload" \
  -H "x-upload-token: $UPLOAD_TOKEN" \
  -F "category=handbags" \
  -F "file=@./my-tote.jpg"
```
Response:
```json
{ "ok": true, "url": "/api/media/handbags/172…-my-tote.webp", "category": "handbags", ... }
```
Omit `category` to save into `uncategorised/`.

### 3. CLI helper
```bash
./scripts/upload-product-image.sh ./my-tote.jpg handbags
```
Second argument is any category slug registered in `/lib/categories.js` (for
example `handbags`, `potli-bags`, `flowers`, `home-decor`, or `accessories`).

### 4. Admin dashboard — drag & drop UI
Go to `/admin` (password from `ADMIN_PASSWORD`), open the **Uploads** tab, choose a
category in the dropdown, and drop files onto the upload area (multi-file supported).

## Notes
- Filenames are timestamp-prefixed and slugified on upload to prevent collisions.
- Every upload is recorded in the `uploads` MySQL table with its category.
- Binaries are gitignored (`.gitignore`) but the folder structure and READMEs are kept.
