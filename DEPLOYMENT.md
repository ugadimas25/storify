# 🚀 Panduan Deployment Storify

Panduan deployment aplikasi Storify ke server Ubuntu dengan Nginx, PostgreSQL, dan SSL.

---

## 📋 Prerequisites

- Server Ubuntu 22.04 LTS
- Domain sudah pointing ke IP server (contoh: storify.asia)
- Akses SSH ke server

---

## 🔧 Langkah 1: Setup Server

### 1.1 Login dan Update Server
```bash
ssh root@<IP_SERVER>
apt update && apt upgrade -y
```

### 1.2 Install Node.js 20.x
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
npm install -g npm@latest

# Verify
node --version  # v20.x.x
npm --version   # v10.x.x+
```

### 1.3 Install PostgreSQL
```bash
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
```

### 1.4 Install Nginx
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 1.5 Install Certbot (untuk SSL)
```bash
apt install -y certbot python3-certbot-nginx
```

---

## 🗄️ Langkah 2: Setup Database

```bash
sudo -u postgres psql
```

```sql
CREATE USER storify_user WITH PASSWORD ''password_aman_anda'';
CREATE DATABASE storify_db OWNER storify_user;
GRANT ALL PRIVILEGES ON DATABASE storify_db TO storify_user;
\q
```

---

## 📁 Langkah 3: Deploy Aplikasi

### 3.1 Clone Repository
```bash
mkdir -p /var/www
cd /var/www
git clone <REPOSITORY_URL> storify
cd storify
```

### 3.2 Install Dependencies
```bash
npm ci
```

### 3.3 Setup Environment Variables
```bash
cp .env.example .env
nano .env
```

Edit file `.env`:
```env
NODE_ENV=production
PORT=5001

# Database
DATABASE_URL=postgresql://storify_user:password_aman_anda@localhost:5432/storify_db

# Xendit (Production Keys dari dashboard.xendit.co)
XENDIT_SECRET_KEY=xnd_production_your_key_here
XENDIT_PUBLIC_KEY=xnd_public_production_your_key_here

# Webhook (generate dengan: openssl rand -hex 32)
WEBHOOK_TOKEN=your_webhook_token_here

# Session
SESSION_SECRET=your_session_secret_here
```

### 3.4 Setup Database Schema
```bash
npm run db:push
```

### 3.5 Build Application
```bash
npm run build

# Verify build berhasil
ls -la dist/index.cjs
ls -la dist/public/
```

---

## 🌐 Langkah 4: Setup Nginx

### 4.1 Buat Konfigurasi Nginx
```bash
nano /etc/nginx/sites-available/storify
```

Paste konfigurasi berikut:
```nginx
server {
    listen 80;
    server_name storify.asia www.storify.asia;

    access_log /var/log/nginx/storify-access.log;
    error_log /var/log/nginx/storify-error.log;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection ''upgrade'';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.2 Enable Site dan Test
```bash
ln -s /etc/nginx/sites-available/storify /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 🔐 Langkah 5: Setup SSL dengan Certbot

```bash
certbot --nginx -d storify.asia -d www.storify.asia
```

Ikuti instruksi interaktif. Certbot akan otomatis:
- Generate SSL certificate
- Update konfigurasi Nginx
- Setup auto-renewal

---

## 🔄 Langkah 6: Setup Systemd Service

### 6.1 Buat Service File
```bash
nano /etc/systemd/system/storify.service
```

Paste konfigurasi berikut:
```ini
[Unit]
Description=Storify Insights Application
Documentation=https://storify.asia
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/storify
Environment=NODE_ENV=production
ExecStart=/usr/bin/node /var/www/storify/dist/index.cjs
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=storify

[Install]
WantedBy=multi-user.target
```

### 6.2 Set Permissions
```bash
chown -R www-data:www-data /var/www/storify
```

### 6.3 Start Service
```bash
systemctl daemon-reload
systemctl enable storify
systemctl start storify
systemctl status storify
```

---

## ✅ Langkah 7: Verifikasi

### 7.1 Test API
```bash
curl http://localhost:5001/api/books
curl https://storify.asia/api/books
```

### 7.2 Buka di Browser
```
https://storify.asia
```

---

## 🔄 Langkah 8: Setup Xendit Webhook

1. Login ke [Xendit Dashboard](https://dashboard.xendit.co/)
2. Pergi ke **Settings → Developers → Callbacks**
3. Klik **Create New Webhook**
4. Isi form:
   - **Webhook URL**: `https://storify.asia/api/webhook/xendit`
   - **Events**: Centang `invoice.paid` dan `invoice.expired`
   - **Verification Token**: Paste token dari `.env` file
5. Klik **Save**

### Test Webhook
```bash
curl -X POST https://storify.asia/api/webhook/xendit \
  -H "Content-Type: application/json" \
  -H "x-callback-token: YOUR_WEBHOOK_TOKEN" \
  -d ''{"external_id":"test-123","status":"PAID"}''
```

---

## 🔄 Update/Redeploy

Buat script update di `/var/www/storify/deploy.sh`:

```bash
#!/bin/bash
cd /var/www/storify

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm ci

echo "🗄️ Updating database schema..."
npm run db:push

echo "🔨 Building application..."
npm run build

echo "🔄 Restarting service..."
systemctl restart storify

echo "✅ Deployment complete!"
systemctl status storify
```

Jalankan:
```bash
chmod +x /var/www/storify/deploy.sh
./deploy.sh
```

---

## 📊 Monitoring

### View Application Logs
```bash
journalctl -u storify -f
journalctl -u storify -n 100
```

### View Nginx Logs
```bash
tail -f /var/log/nginx/storify-access.log
tail -f /var/log/nginx/storify-error.log
```

### Check Status
```bash
systemctl status storify
systemctl status nginx
systemctl status postgresql
```

---

## 🆘 Troubleshooting

### 1. Build Gagal: "Cannot find module tsx"
```bash
cd /var/www/storify
npm ci
npm run build
```

### 2. Service Tidak Start: "Cannot find module dist/index.cjs"
```bash
cd /var/www/storify
npm run build
ls -la dist/index.cjs
systemctl restart storify
```

### 3. Database Connection Error
```bash
# Test koneksi database
psql -h localhost -U storify_user -d storify_db

# Cek PostgreSQL berjalan
systemctl status postgresql
```

### 4. Port 5001 Sudah Dipakai
```bash
# Cari process yang pakai port 5001
lsof -i :5001

# Kill process
kill -9 <PID>
```

### 5. Nginx Error
```bash
# Test konfigurasi
nginx -t

# Reload Nginx
systemctl reload nginx

# Check logs
tail -50 /var/log/nginx/error.log
```

### 6. Fix: useNavigate is not exported by wouter
Wouter menggunakan `useLocation` bukan `useNavigate`:
```tsx
// Salah ❌
import { useNavigate } from "wouter";
const [, setLocation] = useNavigate();

// Benar ✅
import { useLocation } from "wouter";
const [, setLocation] = useLocation();
```

---

## 📝 Quick Commands

```bash
# Restart aplikasi
systemctl restart storify

# Reload Nginx
systemctl reload nginx

# View logs real-time
journalctl -u storify -f

# Database shell
psql -h localhost -U storify_user -d storify_db

# SSL renewal (otomatis via cron, atau manual)
certbot renew

# Check disk space
df -h

# Check memory
free -h
```

---

## 🔒 Security Checklist

- [ ] Firewall enabled (ufw enable)
- [ ] Hanya port 22, 80, 443 terbuka
- [ ] SSL certificate valid
- [ ] Database password kuat
- [ ] Environment variables aman (tidak di-commit ke git)
- [ ] Webhook token aman
- [ ] Session secret random dan panjang
- [ ] Backup database regular

---

## 🎉 Selesai!

Aplikasi Storify sekarang berjalan di: **https://storify.asia**

Untuk bantuan lebih lanjut, check:
- Application logs: `journalctl -u storify -f`
- Nginx logs: `tail -f /var/log/nginx/storify-error.log`
