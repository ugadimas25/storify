# Migrasi Domain: storify.asia → app.storify.asia

Dokumen ini menjelaskan perubahan domain dari `storify.asia` ke `app.storify.asia` beserta panduan setup DNS, SSL, dan deployment.

---

## Gambaran Perubahan

| | Sebelum | Sesudah |
|-|---------|---------|
| **App URL** | `https://storify.asia` | `https://app.storify.asia` |
| **API (Android)** | `https://storify.asia/api/...` | `https://app.storify.asia/api/...` |
| **Privacy Policy** | `https://storify.asia/privacy-policy.html` | `https://app.storify.asia/privacy-policy.html` |
| **Nginx server_name** | `storify.asia www.storify.asia` | `app.storify.asia` |
| **SSL cert path** | `/etc/letsencrypt/live/storify.asia/` | `/etc/letsencrypt/live/app.storify.asia/` |

> Domain `storify.asia` tetap bisa dipakai sebagai **landing page marketing**. Subdomain `app.storify.asia` khusus untuk aplikasi web & API.

---

## File yang Sudah Diubah

| File | Perubahan |
|------|-----------|
| [capacitor.config.ts](capacitor.config.ts) | `allowNavigation` → `app.storify.asia` |
| [client/src/lib/api-config.ts](client/src/lib/api-config.ts) | `API_BASE_URL` → `https://app.storify.asia` |
| [android/app/src/main/res/xml/network_security_config.xml](android/app/src/main/res/xml/network_security_config.xml) | Domain trust → `app.storify.asia` |
| [deploy/nginx/storify.conf](deploy/nginx/storify.conf) | `server_name` → `app.storify.asia` |
| [.env.example](.env.example) | `DOMAIN=app.storify.asia` |
| [.env.production.example](.env.production.example) | `DOMAIN=app.storify.asia` |
| [deploy/deploy.sh](deploy/deploy.sh) | Visit URL diupdate |
| [deploy/systemd/storify.service](deploy/systemd/storify.service) | Documentation URL diupdate |
| [PLAYSTORE_DEPLOYMENT.md](PLAYSTORE_DEPLOYMENT.md) | Semua URL & referensi diupdate |

---

## Langkah 1: Setup DNS

Di panel DNS provider kamu (Cloudflare, Namecheap, dll), tambahkan record:

```
Type   Name    Value              TTL
A      app     <IP_SERVER>        Auto
```

Contoh jika IP server `103.x.x.x`:
```
A    app    103.x.x.x    Auto (atau 3600)
```

Verifikasi propagasi DNS (tunggu 5-30 menit):
```bash
nslookup app.storify.asia
# atau
dig app.storify.asia
```

---

## Langkah 2: Setup SSL (Let's Encrypt)

SSH ke server, lalu jalankan:

```bash
# Stop nginx sementara
sudo systemctl stop nginx

# Request SSL certificate untuk subdomain baru
sudo certbot certonly --standalone -d app.storify.asia

# Verifikasi cert berhasil
sudo ls /etc/letsencrypt/live/app.storify.asia/

# Start nginx kembali
sudo systemctl start nginx
```

---

## Langkah 3: Update Nginx Config di Server

File nginx existing di server sudah bagus (production-grade). Yang perlu dilakukan hanya **ganti domain** dari `storify.asia` ke `app.storify.asia` dan path SSL cert-nya.

Jalankan 2 perintah ini di server (sed replace langsung di file):

```bash
# Ganti domain di nginx config (2 perintah terpisah agar www tidak ikut ter-replace)
sudo sed -i 's/server_name storify\.asia www\.storify\.asia;/server_name app.storify.asia;/g' /etc/nginx/sites-available/storify
sudo sed -i 's|/live/storify\.asia/|/live/app.storify.asia/|g' /etc/nginx/sites-available/storify

# Verifikasi hasilnya
grep 'server_name\|ssl_certificate' /etc/nginx/sites-available/storify
```

Output yang diharapkan:
```
    server_name app.storify.asia;
    server_name app.storify.asia;
    ssl_certificate /etc/letsencrypt/live/app.storify.asia/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.storify.asia/privkey.pem;
```

> ⚠️ **Jangan gunakan** `sed -i 's/storify\.asia/app.storify.asia/g'` karena akan mengubah `www.storify.asia` menjadi `www.app.storify.asia` yang salah.

Test dan reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

> **Catatan:** Pastikan SSL cert untuk `app.storify.asia` sudah di-request dulu di Langkah 2 sebelum reload nginx.

---

## Langkah 4: Deploy Aplikasi Terbaru

```bash
# Di server
cd /var/www/storify

# Pull kode terbaru (sudah ada perubahan domain)
git pull

# Install dependencies
npm ci --production

# Build
npm run build

# Restart aplikasi
sudo systemctl restart storify

# Cek status
sudo systemctl status storify
```

Verifikasi API bisa diakses:

```bash
curl https://app.storify.asia/health
curl https://app.storify.asia/api/books | head -c 100
```

---

## Langkah 5: Update Google OAuth (Jika Pakai Google Login)

Domain baru perlu didaftarkan di Google Cloud Console:

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Pilih project **Storify**
3. Menu **APIs & Services → Credentials**
4. Klik **OAuth 2.0 Client ID** yang dipakai
5. Di bagian **Authorized JavaScript origins**, tambahkan:
   ```
   https://app.storify.asia
   ```
6. Di bagian **Authorized redirect URIs**, tambahkan:
   ```
   https://app.storify.asia/api/auth/google/callback
   ```
7. Klik **Save**

---

## Langkah 6: Update CORS di Tencent COS (jika perlu)

Jika ada batasan CORS di COS bucket, tambahkan `app.storify.asia`:

1. Login Tencent Cloud Console
2. Pilih bucket audio
3. **Permission → CORS rules**
4. Tambahkan origin: `https://app.storify.asia`

---

## Langkah 7: Rebuild Android App

Setelah domain diupdate di kode, rebuild APK/AAB untuk Android:

```bash
# Build web assets
npm run build

# Sync ke Android
npx cap sync android

# Build AAB release untuk Play Store
cd android && ./gradlew bundleRelease && cd ..

# Copy ke folder release
copy android\app\build\outputs\bundle\release\app-release.aab release\storify-v1.2.aab
```

> **Catatan:** Karena domain API berubah, **wajib** upload versi baru ke Play Store agar app Android bisa berkomunikasi dengan server yang benar.

---

## Verifikasi Akhir

Checklist setelah migrasi:

- [ ] DNS `app.storify.asia` sudah resolve ke IP server yang benar
- [ ] SSL cert valid: `https://app.storify.asia` tidak ada warning browser
- [ ] API bisa diakses: `curl https://app.storify.asia/api/books`
- [ ] Health check OK: `curl https://app.storify.asia/health`
- [ ] Google login berfungsi di browser
- [ ] Privacy policy accessible: `https://app.storify.asia/privacy-policy.html`
- [ ] Android app (AAB terbaru) bisa login dan akses data
- [ ] Play Store listing diupdate (website: `https://app.storify.asia`)

---

## Catatan: storify.asia tetap dipakai untuk?

Domain `storify.asia` bisa tetap digunakan sebagai:
- **Landing page / marketing website** — halaman promosi app
- **Redirect** ke `app.storify.asia` untuk user yang akses langsung

Konfigurasikan di nginx `storify.asia`:
```nginx
server {
    listen 80;
    server_name storify.asia www.storify.asia;
    return 301 https://app.storify.asia$request_uri;
}
```
