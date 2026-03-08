#!/bin/bash
# Curl tests for pastor-notes API. Auth via cookie (browser) or JWT for curl.
#
# Prerequisites:
#   - Dev server: npm run dev
#   - Get JWT (while logged in): curl -s http://localhost:3000/api/unit/debug-jwt
#     Then: export JWT="<jwt value from response>"
#
# Usage:
#   ./scripts/pastor-notes-curl.sh              # uses JWT from env; without JWT expects 401
#   JWT="eyJ..." ./scripts/pastor-notes-curl.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"
JWT="${JWT:-}"

HEADERS=(-H "Content-Type: application/json")
if [ -n "$JWT" ]; then
  HEADERS+=(-H "Authorization: Bearer $JWT")
fi

echo "Base URL: $BASE_URL"
echo "Auth: $([ -n "$JWT" ] && echo "Bearer JWT" || echo "none (expect 401)")"
echo ""

# 1) GET list
echo "=== GET /api/pastor-notes ==="
LIST=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/pastor-notes" "${HEADERS[@]}")
HTTP_LIST=$(echo "$LIST" | tail -n1)
BODY_LIST=$(echo "$LIST" | sed '$d')
echo "HTTP $HTTP_LIST"
if command -v jq &>/dev/null; then
  echo "$BODY_LIST" | jq . 2>/dev/null || echo "$BODY_LIST"
else
  echo "$BODY_LIST"
fi
echo ""

if [ "$HTTP_LIST" != "200" ]; then
  echo "Not authenticated (expected if JWT not set). Set JWT and re-run to run full flow."
  exit 0
fi

# 2) POST create
echo "=== POST /api/pastor-notes (create) ==="
CREATE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/pastor-notes" \
  "${HEADERS[@]}" \
  -d '{"title":"Curl test note","content":"<p>Created by curl test.</p>"}')
HTTP_CREATE=$(echo "$CREATE" | tail -n1)
BODY_CREATE=$(echo "$CREATE" | sed '$d')
echo "HTTP $HTTP_CREATE"
if command -v jq &>/dev/null; then
  echo "$BODY_CREATE" | jq . 2>/dev/null || echo "$BODY_CREATE"
else
  echo "$BODY_CREATE"
fi
echo ""

if [ "$HTTP_CREATE" != "200" ]; then
  echo "Create failed."
  exit 1
fi

# Parse note id (jq or grep)
if command -v jq &>/dev/null; then
  NOTE_ID=$(echo "$BODY_CREATE" | jq -r '.id // empty')
else
  NOTE_ID=$(echo "$BODY_CREATE" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
fi
if [ -z "$NOTE_ID" ]; then
  echo "Could not parse note id from create response."
  exit 1
fi
echo "Created note id: $NOTE_ID"
echo ""

# 3) GET one
echo "=== GET /api/pastor-notes/$NOTE_ID ==="
GET_ONE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/pastor-notes/$NOTE_ID" "${HEADERS[@]}")
HTTP_GET=$(echo "$GET_ONE" | tail -n1)
BODY_GET=$(echo "$GET_ONE" | sed '$d')
echo "HTTP $HTTP_GET"
if command -v jq &>/dev/null; then
  echo "$BODY_GET" | jq . 2>/dev/null || echo "$BODY_GET"
else
  echo "$BODY_GET"
fi
echo ""

# 4) PATCH update
echo "=== PATCH /api/pastor-notes/$NOTE_ID ==="
PATCH=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL/api/pastor-notes/$NOTE_ID" \
  "${HEADERS[@]}" \
  -d '{"title":"Curl test note (updated)","content":"<p>Updated by curl test.</p>"}')
HTTP_PATCH=$(echo "$PATCH" | tail -n1)
BODY_PATCH=$(echo "$PATCH" | sed '$d')
echo "HTTP $HTTP_PATCH"
if command -v jq &>/dev/null; then
  echo "$BODY_PATCH" | jq . 2>/dev/null || echo "$BODY_PATCH"
else
  echo "$BODY_PATCH"
fi
echo ""

# 5) DELETE
echo "=== DELETE /api/pastor-notes/$NOTE_ID ==="
DEL=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/pastor-notes/$NOTE_ID" "${HEADERS[@]}")
HTTP_DEL=$(echo "$DEL" | tail -n1)
BODY_DEL=$(echo "$DEL" | sed '$d')
echo "HTTP $HTTP_DEL"
echo "$BODY_DEL"
echo ""

if [ "$HTTP_LIST" = "200" ] && [ "$HTTP_CREATE" = "200" ] && [ "$HTTP_GET" = "200" ] && [ "$HTTP_PATCH" = "200" ] && [ "$HTTP_DEL" = "200" ]; then
  echo "All pastor-notes curl tests passed."
  exit 0
else
  echo "One or more requests failed."
  exit 1
fi
