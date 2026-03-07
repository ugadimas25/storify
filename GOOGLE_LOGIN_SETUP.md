# Google Login Setup Guide - Storify

Panduan lengkap setup Google OAuth Login untuk aplikasi Storify.

---

## 📋 Status Implementasi

✅ **Dependencies installed**: `@react-oauth/google`, `google-auth-library`  
✅ **Database schema updated**: Kolom `googleId` ditambahkan ke tabel `users`  
✅ **Backend handler created**: `server/auth/google.ts`  
✅ **Frontend updated**: Google Login button di `SignIn.tsx`  
✅ **GoogleOAuthProvider configured**: Di `client/src/main.tsx`  

---

## 🚀 Setup Steps

### 1️⃣ Google Cloud Console Setup

#### A. Buat Project di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik "Select a project" → "New Project"
3. Nama project: **Storify** (atau sesuai keinginan)
4. Klik "Create"

#### B. Enable Google+ API / Google Identity Services

1. Di sidebar, pilih **"APIs & Services"** → **"Library"**
2. Search: **"Google+ API"** atau **"Google Identity Services"**
3. Klik "Enable"

#### C. Configure OAuth Consent Screen

1. Pilih **"APIs & Services"** → **"OAuth consent screen"**
2. User Type:
   - **External** - untuk aplikasi public (semua user bisa login)
   - **Internal** - hanya untuk Google Workspace organization
3. Klik **"Create"**

4. **Fill OAuth Consent Screen:**
   ```
   App name: Storify
   User support email: your-email@storify.asia
   App logo: [Optional - upload logo 120x120px]
   Application home page: https://storify.asia
   Developer contact: your-email@storify.asia
   ```

5. **Scopes**: Klik "Add or Remove Scopes"
   - Default scopes yang diperlukan:
     - `openid`
     - `email`
     - `profile`
   - Klik "Update" → "Save and Continue"

6. **Test users** (jika External dalam Development mode):
   - Add email addresses untuk testing
   - Example: `developer@storify.asia`

7. Klik **"Save and Continue"**

#### D. Create OAuth 2.0 Credentials

1. Pilih **"APIs & Services"** → **"Credentials"**
2. Klik **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **Web application**
4. Name: `Storify Web Client`

5. **Authorized JavaScript origins** (tambahkan semua):
   ```
   http://localhost:5000
   http://localhost:5173
   https://storify.asia
   https://www.storify.asia
   ```

6. **Authorized redirect URIs** (tidak wajib untuk web app, tapi bisa ditambahkan):
   ```
   http://localhost:5000
   https://storify.asia
   ```

7. Klik **"Create"**

8. **💾 SIMPAN CREDENTIALS** yang muncul:
   ```
   Client ID: 123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
   Client Secret: GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
   ```

⚠️ **PENTING**: 
- **Client ID** akan digunakan di frontend dan backend
- **Client Secret** tidak digunakan untuk web apps (hanya untuk server-to-server)
- Simpan credentials di tempat aman!

---

### 2️⃣ Environment Variables Setup

Buat atau update file `.env` di root project:

```env
# ===== GOOGLE OAUTH CREDENTIALS =====
# Client ID (digunakan di frontend dan backend)
VITE_GOOGLE_CLIENT_ID="123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com"

# ===== DATABASE (harus sudah ada) =====
DATABASE_URL="postgresql://username:password@localhost:5432/storify_db"

# ===== SESSION SECRET (jika belum ada) =====
SESSION_SECRET="your-session-secret-key-minimum-32-characters-long"
```

⚠️ **IMPORTANT NOTES**:
- **`VITE_GOOGLE_CLIENT_ID`** harus ada prefix `VITE_` karena digunakan di frontend Vite
- Jangan commit `.env` ke Git (pastikan ada di `.gitignore`)
- Untuk production, gunakan environment variables di hosting platform
- Generate SESSION_SECRET dengan: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

### 3️⃣ Database Migration

Database schema sudah diupdate dengan kolom `googleId`. Sekarang perlu push perubahan ke database.

#### Option A: Using Drizzle Kit (Recommended)

```bash
# Generate migration files
npx drizzle-kit generate

# Push schema to database
npm run db:push
```

#### Option B: Manual SQL (jika drizzle-kit tidak bekerja)

Jalankan SQL berikut di PostgreSQL:

```sql
-- Connect to your database
\c storify_db

-- Add googleId column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR UNIQUE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_google_id 
ON users(google_id);

-- Verify
\d users
-- Should show google_id column
```

---

### 4️⃣ Test Setup

#### Start Development Server

```bash
# Install dependencies (jika belum)
npm install

# Start server
npm run dev
```

#### Test Google Login

1. Buka browser: `http://localhost:5173/auth/signin`
2. Klik tombol "Sign in with Google"
3. Pilih Google account
4. Authorize aplikasi
5. Harus redirect ke homepage dan user logged in

#### Troubleshooting

**Issue: Google button tidak muncul**
- Check console browser untuk error
- Verify `VITE_GOOGLE_CLIENT_ID` sudah di-set di `.env`
- Restart dev server setelah menambah/update `.env`

**Issue: "Invalid Client ID"**
- Verify Client ID di Google Console match dengan `.env`
- Check Authorized JavaScript origins sudah ada `http://localhost:5173` dan `http://localhost:5000`
- Tunggu 5-10 menit setelah update di Google Console

**Issue: Token verification failed**
- Check server time sudah sync (NTP)
- Token Google expire setelah 1 jam, coba login lagi
- Check `process.env.VITE_GOOGLE_CLIENT_ID` di backend

---

## 🔧 How It Works

### Flow Diagram

```
User clicks "Sign in with Google"
    ↓
Google OAuth popup opens
    ↓
User selects account & authorizes
    ↓
Google returns ID Token (JWT) to frontend
    ↓
Frontend sends token to /api/auth/google
    ↓
Backend verifies token with Google
    ↓
Backend finds/creates user in database
    ↓
Backend creates session
    ↓
Frontend receives user data & redirects
```

### Security Features

✅ **Token Verification**: ID Token diverify dengan Google API di backend  
✅ **Session-based Auth**: Menggunakan httpOnly cookies  
✅ **Auto Email Verification**: Users dari Google auto-verified  
✅ **Account Linking**: Jika email sudah ada, Google account akan di-link  

---

## 📁 Files Modified/Created

### Backend
- ✅ `server/auth/google.ts` - Google OAuth handler (CREATED)
- ✅ `server/routes.ts` - Added setupGoogleAuth() call
- ✅ `shared/models/auth.ts` - Added googleId column

### Frontend  
- ✅ `client/src/main.tsx` - Added GoogleOAuthProvider
- ✅ `client/src/pages/auth/SignIn.tsx` - Added Google Login button

### Database
- ✅ Schema updated with `googleId` column in `users` table

---

## 🎯 Features

### For Users
- ✅ Login dengan Google account (satu klik)
- ✅ Tidak perlu buat password baru
- ✅ Auto email verification
- ✅ Profile picture dari Google

### For Developers
- ✅ Session-based authentication (consistent dengan sistem existing)
- ✅ Auto-create user jika belum ada
- ✅ Link Google account ke existing user (by email)
- ✅ Activity logging untuk Google login
- ✅ Error handling comprehensive

---

## 🔒 Security Best Practices

### Environment Variables
- ❌ Jangan commit `.env` ke Git
- ✅ Use environment variables di production (Vercel, Railway, dll)
- ✅ Generate strong SESSION_SECRET
- ❌ Jangan expose credentials di console.log

### Token Verification
- ✅ Always verify ID token di backend (sudah implemented)
- ✅ Check audience (clientId) saat verify token
- ❌ Jangan trust token tanpa verification

### Database
- ✅ googleId is UNIQUE - prevents duplicate accounts
- ✅ Email matching untuk link existing users
- ✅ Password is optional (NULL) untuk Google-only users

---

## 📚 Next Steps

### Optional Enhancements

1. **Add to SignUp Page**
   - Tambahkan Google button di `client/src/pages/auth/SignUp.tsx` juga
   - Copy handler dari SignIn.tsx

2. **Enable One Tap**
   - Set `useOneTap={true}` di GoogleLogin component
   - User bisa login otomatis tanpa klik button

3. **Profile Picture**
   - Sudah disimpan di `profileImageUrl` dari Google
   - Tampilkan di user profile/navbar

4. **Analytics**
   - Track Google login success/failure
   - Monitor conversion rate

### Production Deployment

1. **Update Google Console**
   - Tambahkan production domain ke Authorized JavaScript origins
   - Example: `https://storify.asia`, `https://www.storify.asia`

2. **Environment Variables**
   - Set `VITE_GOOGLE_CLIENT_ID` di production environment
   - Set `SESSION_SECRET` (jangan sama dengan development)
   - Set `NODE_ENV=production`

3. **HTTPS Required**
   - Google OAuth butuh HTTPS di production
   - Localhost http:// OK untuk development

4. **Database Migration**
   - Run migration script di production database
   - Backup database sebelum migrate

---

## 🆘 Support

### Useful Resources
- [Google Identity - Web Guide](https://developers.google.com/identity/gsi/web)
- [@react-oauth/google Docs](https://www.npmjs.com/package/@react-oauth/google)
- [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs)

### Common Issues
- Check [TROUBLESHOOTING](#troubleshooting) section above
- Verify all environment variables are set
- Check console logs (browser & server)
- Verify database schema updated

---

## ✅ Checklist

Before deployment, verify:

**Google Cloud Console:**
- [ ] Project created
- [ ] OAuth Consent Screen configured
- [ ] OAuth Client ID created
- [ ] Authorized JavaScript origins added (dev + prod)

**Environment Variables:**
- [ ] `VITE_GOOGLE_CLIENT_ID` set (dengan prefix VITE_)
- [ ] `SESSION_SECRET` set
- [ ] `DATABASE_URL` verified working

**Database:**
- [ ] PostgreSQL running
- [ ] `users` table has `google_id` column
- [ ] Migration applied successfully

**Code:**
- [ ] Dependencies installed (`@react-oauth/google`, `google-auth-library`)
- [ ] Backend handler working (`/api/auth/google`)
- [ ] Frontend shows Google button
- [ ] Test login successful

**Production:**
- [ ] Production domain added to Google Console
- [ ] HTTPS enabled
- [ ] Environment variables set in hosting platform
- [ ] Database migration run in production

---

**Setup Complete! 🎉**

Google Login sudah siap digunakan di aplikasi Storify.
