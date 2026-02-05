# 🏠 Panduan Menjalankan Storify di Local

## 📋 Prerequisites

1. **Node.js 20.x** - [Download](https://nodejs.org/)
2. **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/windows/)
3. **Git** (opsional)

---

## 🚀 Quick Start

### 1. Setup Database PostgreSQL

**Buka pgAdmin atau Command Prompt:**

```sql
-- Buat database
CREATE DATABASE storify_local;

-- Atau dengan user tertentu
CREATE USER storify_user WITH PASSWORD 'password123';
CREATE DATABASE storify_local OWNER storify_user;
GRANT ALL PRIVILEGES ON DATABASE storify_local TO storify_user;
```

### 2. Setup Environment

Buat file `.env` di root project:

```env
DATABASE_URL=postgresql://storify_user:password123@localhost:5432/storify_local
SESSION_SECRET=local-dev-secret-key
PORT=5000
NODE_ENV=development
```

### 3. Install Dependencies

```powershell
cd d:\b_outside\a_intesa_global_technology\Storify\Storify-Insights\Storify-Insights
npm install
```

### 4. Push Database Schema

```powershell
npm run db:push
```

### 5. Jalankan Development Server

**Windows:**
```powershell
npm run dev
```

**Atau manual:**
```powershell
$env:NODE_ENV="development"
npx tsx server/index.ts
```

### 6. Buka Browser

Akses: http://localhost:5000

---

## 📁 Struktur Project

```
Storify-Insights/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── context/        # React context
│   └── public/             # Static assets
├── server/                 # Backend Express
│   ├── auth/               # Local authentication (baru)
│   ├── index.ts            # Entry point
│   ├── routes.ts           # API routes
│   └── storage.ts          # Database operations
├── shared/                 # Shared code
│   ├── schema.ts           # Database schema
│   └── routes.ts           # API route definitions
└── deploy/                 # Deployment configs
```

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run db:push` | Push schema to database |
| `npm run check` | TypeScript type check |

---

## 🔧 Troubleshooting

### Error: DATABASE_URL not set
Pastikan file `.env` sudah dibuat dengan benar.

### Error: Port 5000 already in use
```powershell
# Cari process yang pakai port 5000
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F
```

### Error: npm install gagal
```powershell
# Clear cache
npm cache clean --force

# Remove node_modules dan install ulang
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### PostgreSQL connection refused
1. Pastikan PostgreSQL service running
2. Check di Windows Services > postgresql

---

## 🎨 Features

- ✅ Audio book player
- ✅ Book catalog browsing
- ✅ Favorites management
- ✅ Guest login (simple authentication)
- ✅ Responsive design

---

## 📝 Notes

- Development server otomatis hot-reload saat file berubah
- Database seeding otomatis saat pertama kali start (5 sample books)
- Authentication menggunakan session-based (cookies)
