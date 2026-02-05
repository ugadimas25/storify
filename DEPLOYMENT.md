# 🚀 Panduan Deployment Storify ke Server Tencent

## 📋 Prerequisites

### Di Server Tencent:
- Ubuntu 22.04 LTS atau CentOS 8+
- Node.js 20.x LTS
- PostgreSQL 14+
- Nginx
- Git
- Certbot (untuk SSL)

---

## 🖥️ Langkah 1: Setup Server Tencent

### 1.1 Login ke Server
```bash
ssh root@<IP_SERVER_TENCENT>
```

### 1.2 Update System
```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# CentOS/RHEL
yum update -y
```

### 1.3 Install Node.js 20.x
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### 1.4 Install PostgreSQL
```bash
# Ubuntu/Debian
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql
```

### 1.5 Install Nginx
```bash
# Ubuntu/Debian
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx
```

### 1.6 Install Certbot untuk SSL
```bash
# Ubuntu/Debian
apt install -y certbot python3-certbot-nginx
```

---

## 🗄️ Langkah 2: Setup Database

### 2.1 Buat Database dan User
```bash
sudo -u postgres psql
```

```sql
-- Buat user
CREATE USER storify_user WITH PASSWORD 'your_secure_password_here';

-- Buat database
CREATE DATABASE storify_db OWNER storify_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE storify_db TO storify_user;

-- Exit
\q
```

### 2.2 Test Koneksi
```bash
psql -h localhost -U storify_user -d storify_db
```

---

## 📁 Langkah 3: Deploy Aplikasi

### 3.1 Buat Direktori Aplikasi
```bash
mkdir -p /var/www/storify
chown -R www-data:www-data /var/www/storify
```

### 3.2 Upload Project ke Server

**Opsi A: Via Git (Recommended)**
```bash
cd /var/www/storify
git clone <YOUR_GIT_REPO_URL> .
```

**Opsi B: Via SCP dari Local**
```bash
# Di komputer local Windows (PowerShell)
scp -r ./Storify-Insights/* root@<IP_SERVER>:/var/www/storify/
```

### 3.3 Install Dependencies
```bash
cd /var/www/storify
npm install --production=false
```

### 3.4 Setup Environment Variables
```bash
# Copy template
cp .env.production.example .env

# Edit file
nano .env
```

Isi `.env`:
```env
DATABASE_URL=postgresql://storify_user:your_secure_password@localhost:5432/storify_db
SESSION_SECRET=generate-random-64-character-string-here
PORT=5000
NODE_ENV=production
DOMAIN=storify.global-compliance-system.com

# Xendit Configuration
XENDIT_SECRET_KEY=xnd_production_YOUR_KEY_HERE
XENDIT_WEBHOOK_TOKEN=generate-random-webhook-token-here
XENDIT_PUBLIC_KEY=xnd_public_production_YOUR_KEY_HERE
APP_URL=https://storify.global-compliance-system.com
```

**Generate Random Secrets:**
```bash
# Session Secret
openssl rand -hex 32

# Webhook Token (simpan untuk configure di Xendit Dashboard)
openssl rand -hex 32
```

### 3.5 Push Database Schema
```bash
cd /var/www/storify
npm run db:push
```

### 3.6 Build Production
```bash
npm run build
```

---

## 🌐 Langkah 4: Setup DNS

### 4.1 Di Tencent Cloud DNS atau Domain Registrar

Tambahkan A Record:
```
Type: A
Name: storify
Value: <IP_SERVER_TENCENT>
TTL: 600
```

Domain yang dihasilkan: `storify.global-compliance-system.com`

---

## 🔐 Langkah 5: Setup SSL dengan Certbot

### 5.1 Generate SSL Certificate
```bash
certbot certonly --nginx -d storify.global-compliance-system.com
```

Atau jika nginx belum dikonfigurasi:
```bash
certbot certonly --standalone -d storify.global-compliance-system.com
```

### 5.2 Auto-Renewal
```bash
# Test renewal
certbot renew --dry-run

# Certbot otomatis menambahkan cron job untuk renewal
```

---

## ⚙️ Langkah 6: Konfigurasi Nginx

### 6.1 Copy Konfigurasi
```bash
cp /var/www/storify/deploy/nginx/storify.conf /etc/nginx/sites-available/storify
```

### 6.2 Enable Site
```bash
# Ubuntu/Debian
ln -s /etc/nginx/sites-available/storify /etc/nginx/sites-enabled/

# Hapus default (opsional)
rm /etc/nginx/sites-enabled/default
```

### 6.3 Test dan Reload Nginx
```bash
nginx -t
systemctl reload nginx
```

---

## 🔄 Langkah 7: Setup Systemd Service

### 7.1 Copy Service File
```bash
cp /var/www/storify/deploy/systemd/storify.service /etc/systemd/system/
```

### 7.2 Enable dan Start Service
```bash
# Reload systemd
systemctl daemon-reload

# Enable service (start on boot)
systemctl enable storify

# Start service
systemctl start storify

# Check status
systemctl status storify
```

### 7.3 View Logs
```bash
# Real-time logs
journalctl -u storify -f

# Last 100 lines
journalctl -u storify -n 100
```

---

## ✅ Langkah 8: Verifikasi Deployment

### 8.1 Test Health Check
```bash
curl http://localhost:5000/api/books
```

### 8.2 Test via Domain
```bash
curl https://storify.global-compliance-system.com/api/books
```

### 8.3 Buka di Browser
Akses: https://storify.global-compliance-system.com

---

## � Langkah 9: Setup Xendit Webhook

### 10.1 Login ke Xendit Dashboard
Buka: https://dashboard.xendit.co/

### 9.2 Get API Keys
```
Settings → Developers → API Keys

Mode Production (Live):
- Secret Key: xnd_production_...
- Public Key: xnd_public_production_...

Mode Development (Test):
- Secret Key: xnd_development_...
- Public Key: xnd_public_development_...
```

Copy keys ke file `.env` di server

### 9.3 Configure Webhook
```
Settings → Developers → Callbacks → Create New Webhook

Webhook URL:
https://storify.global-compliance-system.com/api/webhook/xendit

Events:
✅ invoice.paid
✅ invoice.expired

Verification Token:
[Paste token dari .env file yang sudah di-generate dengan openssl rand -hex 32]
```

### 9.4 Test Webhook (Optional)
Di Xendit Dashboard, ada tombol "Test Webhook" untuk mengirim sample payload.

Atau manual test:
```bash
curl -X POST https://storify.global-compliance-system.com/api/webhook/xendit \
  -H "Content-Type: application/json" \
  -H "x-callback-token: YOUR_WEBHOOK_TOKEN" \
  -d '{
    "external_id": "test-123",
    "status": "PAID",
    "payment_method": "EWALLET",
    "payment_channel": "GOPAY"
  }'
```

### 9.5 Monitor Webhook Logs
```bash
# Real-time monitoring
journalctl -u storify -f | grep webhook

# Check recent webhook calls
journalctl -u storify -n 100 | grep webhook
```

---

## 🔒 Langkah 10: Security Hardening

### 9.1 Setup Firewall (UFW)
```bash
# Ubuntu
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
ufw status
```

### 10.2 Tencent Cloud Security Group
Di Console Tencent Cloud, pastikan Security Group mengizinkan:
- Inbound: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- Outbound: All

---

## 🔄 Langkah 11: Update/Redeploy

### Script Update
```bash
#!/bin/bash
cd /var/www/storify
git pull origin main
npm install
npm run build
systemctl restart storify
echo "Deployment complete!"
```

Simpan sebagai `/var/www/storify/deploy.sh` dan jalankan:
```bash
chmod +x /var/www/storify/deploy.sh
./deploy.sh
```

---

## 📊 Langkah 12: Monitoring

### Check App Status
```bash
systemctl status storify
```

### Check Nginx Status
```bash
systemctl status nginx
```

### Check Database
```bash
sudo -u postgres psql -c "SELECT datname, numbackends FROM pg_stat_database WHERE datname = 'storify_db';"
```

### Memory Usage
```bash
free -h
```

### Disk Usage
```bash
df -h
```

---

## 🆘 Troubleshooting

### App tidak start
```bash
journalctl -u storify -n 50 --no-pager
```

### Nginx error
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

### Database connection error
```bash
# Test connection
psql -h localhost -U storify_user -d storify_db -c "SELECT 1"

# Check PostgreSQL status
systemctl status postgresql
```

### Port sudah dipakai
```bash
lsof -i :5000
kill -9 <PID>
```

---

## 📝 Quick Commands Reference

```bash
# Restart App
systemctl restart storify

# Restart Nginx
systemctl reload nginx

# View App Logs
journalctl -u storify -f

# View Nginx Logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Database Shell
psql -h localhost -U storify_user -d storify_db

# SSL Renewal
certbot renew
```

---

## 🎉 Selesai!

Aplikasi Storify sekarang berjalan di:
**https://storify.global-compliance-system.com**

