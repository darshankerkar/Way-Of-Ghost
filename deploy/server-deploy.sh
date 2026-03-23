#!/bin/bash
# ============================================================
# Server Deployment Script
# Run from the project root: bash deploy/server-deploy.sh
# ============================================================

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "=========================================="
echo " Deploying Server..."
echo "=========================================="

# --- 1. Start Piston (Code Execution Engine) ---
echo "[1/5] Starting Piston Docker container..."
docker compose up -d
echo "Waiting for Piston to start..."
sleep 10

# Install language runtimes in Piston
echo "Installing language runtimes (java, python, gcc)..."
node server/install-piston.js || echo "Warning: Some Piston packages may have failed. Check above."

# --- 2. Install server dependencies ---
echo "[2/5] Installing server dependencies..."
cd "$PROJECT_DIR/server"
npm install

# --- 3. Generate Prisma client & run migrations ---
echo "[3/5] Running Prisma generate & migrations..."
npx prisma generate
npx prisma migrate deploy

# --- 4. Build the server ---
echo "[4/5] Building server..."
npm run build

# --- 5. Start with PM2 ---
echo "[5/5] Starting server with PM2..."
pm2 delete ronin 2>/dev/null || true
pm2 start dist/index.js --name ronin --env production
pm2 save
pm2 startup | tail -1 | sudo bash || true

cd "$PROJECT_DIR"

echo ""
echo "=========================================="
echo " Server deployed!"
echo "=========================================="
echo ""
echo " Check status:  pm2 status"
echo " View logs:     pm2 logs ronin"
echo " Restart:       pm2 restart ronin"
echo ""
