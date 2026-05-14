#!/bin/bash
# Test the /api/gallery routes against the local dev server.
# Run: bash scripts/test-gallery-api.sh
# Requires: bun dev running on localhost:3000

BASE="http://localhost:3000/api/gallery"

echo "=== 1. Save a design (POST) ==="
SAVE_RESPONSE=$(curl -s -X POST "$BASE" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://picsum.photos/seed/interior-result/800/600",
    "theme": "Bohemian",
    "room": "Bedroom"
  }')
echo "$SAVE_RESPONSE" | bunx prettier --parser json 2>/dev/null || echo "$SAVE_RESPONSE"
SAVED_URL=$(echo "$SAVE_RESPONSE" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
echo ""

echo "=== 2. List all designs (GET) ==="
curl -s "$BASE" | bunx prettier --parser json 2>/dev/null || curl -s "$BASE"
echo ""

echo "=== 3. Delete the saved design (DELETE) ==="
if [ -n "$SAVED_URL" ]; then
  curl -s -X DELETE "$BASE" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$SAVED_URL\"}" | bunx prettier --parser json 2>/dev/null
  echo ""
  echo "=== 4. Verify deletion (GET) ==="
  curl -s "$BASE" | bunx prettier --parser json 2>/dev/null || curl -s "$BASE"
else
  echo "Skipped — no URL returned from save step (check BLOB_READ_WRITE_TOKEN in .env.local)"
fi
