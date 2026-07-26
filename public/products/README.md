# SutraKriti — Product Images

This folder holds hand-uploaded product images for the SutraKriti catalogue.

Any file you drop in here is served publicly at `/products/<filename>`.

## Ways to add images

### 1. Manual (drag & drop / SFTP)
Simply place your `.jpg`, `.webp`, `.png` files in this folder. They become available immediately at:
```
https://<your-domain>/products/<filename>
```
Use that URL as the `image` field for a product in `/app/lib/products.js`.

Recommended: 1200 × 1500 px (4:5 portrait), JPG or WebP, < 500 KB, colour-graded warm.

### 2. API upload
Use the `/api/upload` endpoint (see `README.md` and `DEPLOYMENT.md` at project root for full docs).

Example:
```bash
curl -X POST https://<your-domain>/api/upload \
  -H "x-upload-token: $UPLOAD_TOKEN" \
  -F "file=@/path/to/photo.jpg"
```

The API returns:
```json
{ "ok": true, "url": "/products/1712345678-abc123.jpg", "filename": "..." }
```

### 3. Bulk CLI helper
```bash
./scripts/upload-product-image.sh /path/to/photo.jpg
```

## Notes
- Filenames are slugified and prefixed with a timestamp on upload to prevent collisions.
- Every upload is recorded in the `uploads` MySQL table.
- Do not commit large binaries to git. Use `.gitignore` (already configured to ignore images in this folder except this README).
