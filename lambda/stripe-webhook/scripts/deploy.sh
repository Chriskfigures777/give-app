#!/usr/bin/env bash
# Deploy Stripe webhook Lambda via AWS CLI.
# Prerequisites: AWS CLI configured, env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
# Usage: ./scripts/deploy.sh [AWS_REGION] [AWS_ACCOUNT_ID]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAMBDA_DIR="$(dirname "$SCRIPT_DIR")"
REGION="${1:-us-east-2}"
ACCOUNT_ID="${2:-$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo '')}"
ROLE_NAME="stripe-webhook-lambda-role"
FUNCTION_NAME="stripe-webhook-handler"

cd "$LAMBDA_DIR"
pnpm install
pnpm run build
pnpm run package

# Create IAM role if not exists
if ! aws iam get-role --role-name "$ROLE_NAME" 2>/dev/null; then
  echo "Creating IAM role $ROLE_NAME..."
  aws iam create-role --role-name "$ROLE_NAME" \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
  aws iam attach-role-policy --role-name "$ROLE_NAME" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
  echo "Waiting for role to propagate..."
  sleep 10
fi

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

# Build env vars from current shell (or .env)
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-$STRIPE_WEBHOOK_SECRET_1}"
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [ -z "$STRIPE_SECRET_KEY" ] || [ -z "$STRIPE_WEBHOOK_SECRET" ] || [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "Error: Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

ENV_VARS="Variables={STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY,STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET,SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY}"

if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" 2>/dev/null; then
  echo "Updating existing Lambda $FUNCTION_NAME..."
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file fileb://dist.zip \
    --region "$REGION"
  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --runtime nodejs22.x \
    --handler index.handler \
    --timeout 30 \
    --memory-size 256 \
    --environment "$ENV_VARS" \
    --region "$REGION"
else
  echo "Creating new Lambda $FUNCTION_NAME..."
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime nodejs22.x \
    --role "$ROLE_ARN" \
    --handler index.handler \
    --zip-file fileb://dist.zip \
    --environment "$ENV_VARS" \
    --timeout 30 \
    --memory-size 256 \
    --region "$REGION"
fi

echo "Lambda deployed. Create a Function URL or API Gateway endpoint and point Stripe webhook to it."
