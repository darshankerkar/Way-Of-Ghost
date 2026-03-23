# AWS Deployment Guide - GDG Spectrum

## Architecture Overview

```
                    ┌──────────────────────┐
                    │    CloudFront CDN     │
                    │   (React SPA cache)   │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │     S3 Bucket         │
                    │  (client/dist build)  │
                    └──────────────────────┘

Users ──► ┌──────────────────────────────────────┐
          │          EC2 Instance                  │
          │   (t3.medium / t3.large recommended)   │
          │                                        │
          │  ┌─────────┐   ┌──────────────────┐   │
          │  │  Nginx   │──►│  Express + PM2   │   │
          │  │ :80/:443 │   │   :5000          │   │
          │  └─────────┘   └──────────────────┘   │
          │                                        │
          │  ┌──────────────────────────────────┐  │
          │  │   Piston Docker (privileged)     │  │
          │  │   :2000 (code execution)         │  │
          │  └──────────────────────────────────┘  │
          └──────────────────────────────────────┘
                               │
                    ┌──────────▼───────────┐
                    │   Supabase (or RDS)   │
                    │     PostgreSQL         │
                    └──────────────────────┘
```

---

## Step 1: Launch EC2 Instance

1. Go to **AWS Console > EC2 > Launch Instance**
2. Configure:
   - **Name**: `gdg-spectrum-server`
   - **AMI**: Ubuntu 22.04 LTS (or 24.04)
   - **Instance Type**: `t3.medium` (2 vCPU, 4 GB RAM) — minimum for Piston
   - **Key Pair**: Create or select an existing key pair
   - **Storage**: 30 GB gp3 (Piston images need space)
   - **Security Group**: Create with these inbound rules:

     | Type  | Port  | Source    | Purpose              |
     |-------|-------|-----------|----------------------|
     | SSH   | 22    | Your IP   | Remote access        |
     | HTTP  | 80    | 0.0.0.0/0 | Web traffic          |
     | HTTPS | 443   | 0.0.0.0/0 | Secure web traffic   |
     | Custom| 2000  | 127.0.0.1 | Piston (internal)    |

3. Launch and note your **Elastic IP** (allocate one under EC2 > Elastic IPs)

---

## Step 2: SSH Into EC2 & Run Setup

```bash
# SSH into your instance
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP

# Clone your repo
git clone https://github.com/YOUR_USERNAME/gdg-spectrum.git ~/gdg-spectrum
cd ~/gdg-spectrum

# Make scripts executable
chmod +x deploy/*.sh

# Run the setup script (installs Node, Docker, Nginx, PM2, Certbot)
bash deploy/aws-setup.sh

# IMPORTANT: Log out and back in for Docker permissions
exit
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
```

---

## Step 3: Configure Environment

```bash
cd ~/gdg-spectrum/server

# Copy and edit the production env file
cp .env.production.example .env

# Edit with your actual values
nano .env
```

**Required changes in `.env`:**
- `DATABASE_URL` — Your Supabase connection string
- `JWT_SECRET` — A strong random secret (use: `openssl rand -base64 32`)
- `CLIENT_ORIGIN` — Your frontend URL (CloudFront or Vercel URL)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — Your admin credentials
- `PISTON_URL` — Keep as `http://localhost:2000/api/v2/piston/execute`

---

## Step 4: Deploy the Server

```bash
cd ~/gdg-spectrum

# Deploy server + start Piston + PM2
bash deploy/server-deploy.sh

# Verify everything is running
pm2 status
docker ps
curl http://localhost:5000/health
curl http://localhost:2000/api/v2/runtimes
```

---

## Step 5: Configure Nginx

```bash
# Copy nginx config
sudo cp deploy/nginx.conf /etc/nginx/sites-available/gdg-spectrum

# Edit and replace YOUR_DOMAIN_OR_IP with your Elastic IP or domain
sudo nano /etc/nginx/sites-available/gdg-spectrum

# Enable the site
sudo ln -sf /etc/nginx/sites-available/gdg-spectrum /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

# Test from outside
curl http://YOUR_ELASTIC_IP/health
```

---

## Step 6: SSL Certificate (Optional but Recommended)

If you have a domain pointed to your EC2 IP:

```bash
sudo certbot --nginx -d api.yourdomain.com
```

Certbot will auto-configure Nginx for HTTPS and set up auto-renewal.

---

## Step 7: Deploy Frontend (Option A: S3 + CloudFront)

### Create S3 Bucket

```bash
# Install AWS CLI on your LOCAL machine (not EC2)
# Configure: aws configure (enter your Access Key, Secret, Region)

# Create bucket (ap-south-1 for India)
aws s3 mb s3://gdg-spectrum-client --region ap-south-1

# Enable static website hosting
aws s3 website s3://gdg-spectrum-client \
    --index-document index.html \
    --error-document index.html
```

### Set S3 Bucket Policy (public read)

```bash
aws s3api put-bucket-policy --bucket gdg-spectrum-client --policy '{
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::gdg-spectrum-client/*"
    }]
}'
```

### Create CloudFront Distribution

1. Go to **AWS Console > CloudFront > Create Distribution**
2. Origin domain: `gdg-spectrum-client.s3-website-ap-south-1.amazonaws.com`
3. **Important**: Under "Origin" settings:
   - Protocol: HTTP only (S3 website endpoint)
4. Default cache behavior:
   - Viewer protocol: Redirect HTTP to HTTPS
   - Allowed methods: GET, HEAD
5. Custom error responses:
   - Error code 403 → Response page `/index.html`, Response code 200
   - Error code 404 → Response page `/index.html`, Response code 200
   (This makes React Router work)
6. Note the **Distribution ID** and **Domain Name**

### Build & Deploy

```bash
# Edit deploy/s3-deploy.sh and set:
#   S3_BUCKET="gdg-spectrum-client"
#   CLOUDFRONT_DIST_ID="EXXXXXXXXXXXXX"
#   API_URL="https://api.yourdomain.com" (or http://YOUR_ELASTIC_IP)

bash deploy/s3-deploy.sh
```

---

## Step 7: Deploy Frontend (Option B: Vercel — Simpler)

If you prefer Vercel (already configured with `vercel.json`):

1. Push the `client/` folder to a separate repo or use Vercel monorepo support
2. In Vercel dashboard, set:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Environment Variable**: `VITE_API_URL` = `https://api.yourdomain.com`
3. Deploy

Then update `CLIENT_ORIGIN` in your server `.env` to the Vercel URL.

---

## Monitoring & Maintenance

```bash
# Server logs
pm2 logs ronin
pm2 monit

# Restart server
pm2 restart ronin

# View Piston logs
docker logs way-of-ghost-piston

# Update deployment
cd ~/gdg-spectrum
git pull
cd server && npm install && npx prisma generate && npx prisma migrate deploy && npm run build
pm2 restart ronin
```

---

## Cost Estimate (ap-south-1 / Mumbai)

| Service          | Spec              | ~Monthly Cost |
|-----------------|-------------------|---------------|
| EC2 t3.medium   | 2 vCPU, 4GB RAM   | ~$30          |
| Elastic IP      | 1 static IP       | ~$3.65        |
| S3              | <1GB static files | ~$0.50        |
| CloudFront      | Light traffic     | ~$1-5         |
| **Total**       |                   | **~$35-40**   |

*Supabase free tier covers the database. For RDS, add ~$15-25/month.*

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Piston not starting | Check: `docker logs way-of-ghost-piston`, ensure 30GB+ disk |
| Socket.io not connecting | Verify Nginx WebSocket config, check `CLIENT_ORIGIN` in `.env` |
| CORS errors | Ensure `CLIENT_ORIGIN` matches your exact frontend URL (no trailing slash) |
| Prisma connection fails | Check `DATABASE_URL`, ensure Supabase allows your EC2 IP |
| PM2 not surviving reboot | Run: `pm2 startup` and follow the output |
| 502 Bad Gateway | Server crashed — check `pm2 logs ronin` |
