#!/usr/bin/env bash
# SutraKriti — upload a product image to /api/upload
# Usage: ./scripts/upload-product-image.sh <path-to-image> [base-url]
set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <path-to-image> [base-url]"
  exit 1
fi

FILE="$1"
if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE"
  exit 1
fi

# Load .env variables if present
if [ -f .env ]; then
  # shellcheck disable=SC2046
  export $(grep -E '^(NEXT_PUBLIC_BASE_URL|UPLOAD_TOKEN)=' .env | sed 's/#.*//g' | xargs -0 echo | tr ' ' '\n' | grep '=')
fi

BASE_URL="${2:-${NEXT_PUBLIC_BASE_URL:-http://localhost:3000}}"
TOKEN="${UPLOAD_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "UPLOAD_TOKEN is not set (add it to .env)"
  exit 1
fi

echo "Uploading $FILE to $BASE_URL/api/upload ..."
curl -sS -X POST "$BASE_URL/api/upload" \
  -H "x-upload-token: $TOKEN" \
  -F "file=@$FILE" | tee /tmp/upload-response.json
echo
