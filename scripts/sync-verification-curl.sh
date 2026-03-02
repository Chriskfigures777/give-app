#!/bin/bash
# Sync Stripe verification status for an organization and update the dashboard.
# Run from project root. Ensure dev server is running: npm run dev
#
# Usage:
#   ./scripts/sync-verification-curl.sh "Figures"           # by name (partial match)
#   ./scripts/sync-verification-curl.sh "CB Figures House"   # by name
#   ./scripts/sync-verification-curl.sh "eb517360-3856-41a3-b627-1e35f9dac053"  # by ID

ORG="${1:-Figures}"
BASE_URL="${BASE_URL:-http://localhost:3000}"
SECRET="${CONNECT_SYNC_SECRET:-}"

HEADERS=(-H "Content-Type: application/json")
if [ -n "$SECRET" ]; then
  HEADERS+=(-H "X-Sync-Secret: $SECRET")
fi

# Try as UUID first (organizationId), else organizationName
if [[ "$ORG" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
  BODY="{\"organizationId\": \"$ORG\"}"
else
  BODY="{\"organizationName\": \"$ORG\"}"
fi

echo "Syncing verification for: $ORG"
echo "Request: POST $BASE_URL/api/connect/sync-verification"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/api/connect/sync-verification" \
  "${HEADERS[@]}" \
  -d "$BODY")

if command -v jq &>/dev/null; then
  echo "$RESPONSE" | jq .
else
  echo "$RESPONSE"
fi
