#!/bin/bash
# ============================================================
# Client Deployment to S3 + CloudFront
# Run from the project root: bash deploy/s3-deploy.sh
#
# Prerequisites:
#   - AWS CLI installed and configured (aws configure)
#   - S3 bucket created (see instructions below)
#   - CloudFront distribution created (see instructions below)
# ============================================================

set -euo pipefail

# ---- CONFIGURATION (edit these) ----
S3_BUCKET="gdg-spectrum-client"           # Your S3 bucket name
CLOUDFRONT_DIST_ID=""                      # Your CloudFront distribution ID (optional)
API_URL="https://api.yourdomain.com"       # Your EC2 server URL
# -------------------------------------

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR/client"

echo "=========================================="
echo " Building & Deploying Client to S3"
echo "=========================================="

# --- 1. Set environment and build ---
echo "[1/3] Building client..."
echo "VITE_API_URL=$API_URL" > .env.production
npm install
npm run build

# --- 2. Sync to S3 ---
echo "[2/3] Uploading to S3..."
aws s3 sync dist/ "s3://$S3_BUCKET" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html" \
    --exclude "*.json"

# Upload index.html and JSON with no-cache
aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" \
    --cache-control "no-cache, no-store, must-revalidate"

# Upload any JSON files (like manifest) with short cache
for f in dist/*.json; do
    [ -f "$f" ] && aws s3 cp "$f" "s3://$S3_BUCKET/$(basename $f)" \
        --cache-control "public, max-age=60"
done

# --- 3. Invalidate CloudFront cache ---
if [ -n "$CLOUDFRONT_DIST_ID" ]; then
    echo "[3/3] Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DIST_ID" \
        --paths "/*"
else
    echo "[3/3] Skipping CloudFront invalidation (no distribution ID set)"
fi

echo ""
echo "=========================================="
echo " Client deployed to S3!"
echo "=========================================="
echo ""
echo " S3 URL: http://$S3_BUCKET.s3-website-ap-south-1.amazonaws.com"
echo ""
