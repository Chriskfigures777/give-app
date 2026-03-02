#!/usr/bin/env bash
# Test Supabase Auth connectivity - run from project root: ./scripts/test-supabase.sh
# Loads from .env.local

set -e
cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "Error: .env.local not found"
  exit 1
fi

# Source env (simple parse - no quotes with spaces)
export $(grep -v '^#' .env.local | grep -E '^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_URL|SUPABASE_ANON_KEY)=' | xargs)

URL="${NEXT_PUBLIC_SUPABASE_URL:-$SUPABASE_URL}"
KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-$SUPABASE_ANON_KEY}"

if [ -z "$URL" ] || [ -z "$KEY" ]; then
  echo "Error: Need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  exit 1
fi

echo "Testing Supabase at: $URL"
echo ""

# 1. Health check (with retries for transient network issues)
echo "1. Health check..."
for i in 1 2 3; do
  HEALTH=$(curl -s -w "\n%{http_code}" --connect-timeout 5 --max-time 10 \
    "$URL/auth/v1/health" \
    -H "apikey: $KEY" \
    -H "Authorization: Bearer $KEY" 2>/dev/null) || true
  HTTP=$(echo "$HEALTH" | tail -1)
  if [ "$HTTP" = "200" ] || [ "$HTTP" = "401" ]; then
    echo "   OK (HTTP $HTTP) - Supabase reachable"
    break
  fi
  if [ $i -lt 3 ]; then
    echo "   Retry $i/3 in 2s..."
    sleep 2
  else
    echo "   FAIL (HTTP $HTTP)"
    echo "   Response: $(echo "$HEALTH" | sed '$d' | head -c 200)"
    exit 1
  fi
done

# 2. Sign up (with retries)
echo ""
echo "2. Sign up test..."
for i in 1 2 3; do
  SIGNUP=$(curl -s -w "\n%{http_code}" --connect-timeout 5 --max-time 10 \
    -X POST "$URL/auth/v1/signup" \
    -H "apikey: $KEY" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d '{"email":"test-supabase-'"$(date +%s)"'@example.com","password":"testpass123"}' 2>/dev/null) || true
  HTTP=$(echo "$SIGNUP" | tail -1)
  if [ "$HTTP" = "200" ] || [ "$HTTP" = "201" ] || [ "$HTTP" = "422" ]; then
    echo "   OK (HTTP $HTTP) - Auth API responding"
    break
  fi
  if [ $i -lt 3 ]; then
    echo "   Retry $i/3 in 2s..."
    sleep 2
  else
    echo "   FAIL (HTTP $HTTP)"
    echo "   Response: $(echo "$SIGNUP" | sed '$d' | head -c 200)"
    exit 1
  fi
done

echo ""
echo "All checks passed. Supabase is reachable with your anon key."
