#!/bin/bash
# ============================================================
# AWS EC2 Setup Script for GDG Spectrum (Last Standing Ronin)
# Run this on a fresh Ubuntu 22.04/24.04 EC2 instance
# ============================================================

set -euo pipefail

echo "=========================================="
echo " GDG Spectrum - AWS EC2 Setup"
echo "=========================================="

# --- 1. System Updates ---
echo "[1/8] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# --- 2. Install Node.js 20 LTS ---
echo "[2/8] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# --- 3. Install Docker ---
echo "[3/8] Installing Docker..."
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
echo "Docker version: $(docker --version)"

# --- 4. Install PM2 ---
echo "[4/8] Installing PM2..."
sudo npm install -g pm2

# --- 5. Install Nginx ---
echo "[5/8] Installing Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx

# --- 6. Install Certbot (for SSL) ---
echo "[6/8] Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

# --- 7. Clone & Setup Project ---
echo "[7/8] Setting up project..."
echo ""
echo "  Next steps (run manually):"
echo "  1. Clone your repo:  git clone <your-repo-url> ~/gdg-spectrum"
echo "  2. cd ~/gdg-spectrum"
echo "  3. Run: bash deploy/server-deploy.sh"
echo ""

# --- 8. Configure Firewall ---
echo "[8/8] Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 2000/tcp   # Piston API (internal only - remove if not needed externally)
sudo ufw --force enable

echo ""
echo "=========================================="
echo " Setup Complete!"
echo "=========================================="
echo ""
echo " IMPORTANT: Log out and back in for Docker"
echo " group permissions to take effect."
echo ""
echo " Security Group (AWS Console) - open these ports:"
echo "   - 22    (SSH)"
echo "   - 80    (HTTP)"
echo "   - 443   (HTTPS)"
echo "   - 2000  (Piston - only if needed externally)"
echo ""
