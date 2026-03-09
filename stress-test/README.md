# 🔥 Stress Test Guide — Storify Production

## Tujuan
Menguji apakah server `app.storify.asia` mampu menangani **100 concurrent users**.

---

## 1. Install Artillery

```bash
npm install -g artillery@latest
```

Verify:
```bash
artillery version
```

---

## 2. Jalankan Quick Test (100 users, 1 menit)

```bash
artillery run stress-test/quick-test.yml
```

Output yang baik:
```
http.response_time:
  min: ........ 45
  max: ........ 850
  median: ..... 120
  p95: ........ 480    ← harus < 3000ms
  p99: ........ 720    ← harus < 5000ms

http.codes.200: 6000   ← semua sukses
http.codes.5xx: 0      ← tidak ada error
```

---

## 3. Jalankan Full Load Test (warmup → 100 users → spike 200)

```bash
artillery run stress-test/load-test.yml --output stress-test/report.json
```

Buat HTML report:
```bash
artillery report stress-test/report.json --output stress-test/report.html
```
Buka `stress-test/report.html` di browser untuk grafik lengkap.

---

## 4. Interpretasi Hasil

| Metrik | Sehat | Perlu Perhatian | Kritis |
|--------|-------|-----------------|--------|
| p95 response time | < 1s | 1–3s | > 3s |
| Error rate | < 1% | 1–5% | > 5% |
| p99 response time | < 2s | 2–5s | > 5s |

---

## 5. Bottleneck yang Sudah Diidentifikasi

### ❌ Single Node.js Process
Server berjalan 1 process saja. CPU-bound tasks akan memblokir semua request.

**Fix: Gunakan PM2 Cluster Mode**
```bash
# Di server production
npm install -g pm2

# Stop systemd service dulu
systemctl stop storify
systemctl disable storify

# Jalankan dengan PM2 cluster (semua CPU core)
pm2 start dist/index.cjs --name storify -i max
pm2 startup
pm2 save

# Status
pm2 list
pm2 monit
```

### ❌ MemoryStore Sessions
Default express-session pakai MemoryStore — bocor memori & tidak shared antar cluster.

**Fix: Gunakan connect-pg-simple (session di PostgreSQL)**
```bash
npm install connect-pg-simple
```

Di `server/index.ts`:
```typescript
import connectPg from "connect-pg-simple";
const PgStore = connectPg(session);

app.use(session({
  store: new PgStore({
    conString: process.env.DATABASE_URL,
    tableName: "sessions",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));
```

### ❌ Tidak Ada Rate Limiting
Endpoint seperti `/api/auth/signin` rentan brute force & bisa kelebihan beban.

**Fix: Tambahkan express-rate-limit**
```bash
npm install express-rate-limit
```

Di `server/index.ts`:
```typescript
import rateLimit from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 200,            // max 200 req per IP per menit
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10,                   // max 10 login attempts
});

app.use("/api/", apiLimiter);
app.use("/api/auth/signin", authLimiter);
app.use("/api/auth/signup", authLimiter);
```

### ⚠️ Nginx Buffer Settings
Kalau response lambat, cek buffer Nginx di server.

Tambahkan di `/etc/nginx/sites-available/storify`:
```nginx
location / {
    proxy_pass http://localhost:5001;
    
    # Buffer settings
    proxy_buffering on;
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
    
    # Timeout
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Existing headers...
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

---

## 6. Monitor Server Saat Load Test

Buka SSH ke server di terminal terpisah:

```bash
# CPU & Memory real-time
htop

# Request log real-time
journalctl -u storify -f

# Koneksi aktif
ss -s

# PostgreSQL active connections
psql -U storify_user -d storify_db -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 7. Estimasi Kapasitas

| Kondisi | Perkiraan Max Users |
|---------|---------------------|
| Single process (sekarang) | ~50–80 bersamaan |
| PM2 cluster (4 core) | ~200–400 bersamaan |
| PM2 + Redis sessions | ~500+ bersamaan |
| + CDN untuk static assets | ~1000+ bersamaan |

> Catatan: Tergantung spec server (RAM, CPU core) dan jenis request.
> Request yang hanya baca DB lebih ringan dari yang tulis.

---

## 8. Quick Fix Priority

1. **Sekarang**: Jalankan stress test → lihat di mana bottleneck
2. **Penting**: Migrasi ke PM2 cluster (paling besar impact-nya)
3. **Penting**: Ganti MemoryStore → connect-pg-simple
4. **Disarankan**: Tambah rate limiting untuk keamanan
5. **Opsional**: Nginx buffer tuning
