#!/usr/bin/env bash
# SutraKriti — upload a product image to /api/upload
# Usage:
#   ./scripts/upload-product-image.sh <path-to-image> [category-slug] [base-url]
#
# category-slug (optional): handbags | potli-bags | flowers | home-decor
#   When omitted, the file is saved into public/products/uncategorised/.
#
# Examples:
#   ./scripts/upload-product-image.sh ./my-tote.jpg handbags
#   ./scripts/upload-product-image.sh ./bouquet.jpg flowers https://sutrakriti.com
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <path-to-image> [category-slug] [base-url]"
  echo "Categories: handbags | potli-bags | flowers | home-decor"
  exit 1
fi

FILE="$1"
CATEGORY="${2:-}"
if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE"
  exit 1
fi

# Load .env variables if present
if [ -f .env ]; then
  # shellcheck disable=SC2046
  export $(grep -E '^(NEXT_PUBLIC_BASE_URL|UPLOAD_TOKEN)=' .env | sed 's/#.*//g' | xargs -0 echo | tr ' ' '\n' | grep '=')
fi

BASE_URL="${3:-${NEXT_PUBLIC_BASE_URL:-http://localhost:3000}}"
TOKEN="${UPLOAD_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "UPLOAD_TOKEN is not set (add it to .env)"
  exit 1
fi

if [ -n "$CATEGORY" ]; then
  echo "Uploading $FILE (category: $CATEGORY) → $BASE_URL/api/upload"
  curl -sS -X POST "$BASE_URL/api/upload" \
    -H "x-upload-token: $TOKEN" \
    -F "category=$CATEGORY" \
    -F "file=@$FILE" | tee /tmp/upload-response.json
else
  echo "Uploading $FILE (no category → uncategorised) → $BASE_URL/api/upload"
  curl -sS -X POST "$BASE_URL/api/upload" \
    -H "x-upload-token: $TOKEN" \
    -F "file=@$FILE" | tee /tmp/upload-response.json
fi
echo
