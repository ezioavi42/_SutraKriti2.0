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
└── uncategorised/  # Files uploaded without a category
```

The canonical list of categories lives in `/lib/categories.js`. Add a new
category there first, then create a matching folder here.

## Three ways to add images

### 1. Manual drag & drop / SFTP
Drop `.jpg / .webp / .png / .avif` files into the appropriate category folder.
They become available immediately at `/products/<slug>/<filename>`.

Use that URL as the `image` field for a product in `/lib/products.js`.

Recommended: **1200 × 1500 px (4:5 portrait)**, WebP or high-quality JPEG,
under 500 KB, colour-graded warm.

### 2. API upload
```bash
curl -X POST "$NEXT_PUBLIC_BASE_URL/api/upload" \
  -H "x-upload-token: $UPLOAD_TOKEN" \
  -F "category=handbags" \
  -F "file=@./my-tote.jpg"
```
Response:
```json
{ "ok": true, "url": "/products/handbags/172…-my-tote.jpg", "category": "handbags", ... }
```
Omit `category` to save into `uncategorised/`.

### 3. CLI helper
```bash
./scripts/upload-product-image.sh ./my-tote.jpg handbags
```
Second argument is the category slug (`handbags`, `potli-bags`, `flowers`, `home-decor`).

### 4. Admin dashboard — drag & drop UI
Go to `/admin` (password from `ADMIN_PASSWORD`), open the **Uploads** tab, choose a
category in the dropdown, and drop files onto the upload area (multi-file supported).

## Notes
- Filenames are timestamp-prefixed and slugified on upload to prevent collisions.
- Every upload is recorded in the `uploads` MySQL table with its category.
- Binaries are gitignored (`.gitignore`) but the folder structure and READMEs are kept.
