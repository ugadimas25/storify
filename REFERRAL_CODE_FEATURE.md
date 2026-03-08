# 🎁 Fitur Kode Referral Storify

Panduan implementasi dan penggunaan sistem kode referral dengan diskon 10% untuk pembayaran subscription Storify.

---

## 📋 Overview

Sistem kode referral memungkinkan pengguna untuk:
- **Mendapatkan kode referral unik** setelah login
- **Membagikan kode** ke teman/keluarga
- **Menggunakan kode orang lain** untuk mendapatkan **diskon 10%** saat subscribe

---

## 🏗️ Arsitektur

### Database Schema

#### Table: `referral_codes`
```sql
CREATE TABLE referral_codes (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,          -- Format: STORIFY-ABC123
  user_id TEXT NOT NULL,              -- Pemilik kode
  discount_percent INTEGER DEFAULT 10,-- Persentase diskon (%)
  usage_count INTEGER DEFAULT 0,      -- Jumlah penggunaan
  max_usage INTEGER,                  -- Batas maksimal (NULL = unlimited)
  is_active BOOLEAN DEFAULT TRUE,     -- Status aktif
  expires_at TIMESTAMP,               -- Tanggal kadaluarsa (NULL = tidak ada)
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Table: `payment_transactions` (updated)
Kolom baru untuk tracking referral:
- `original_amount`: Harga asli sebelum diskon
- `discount_amount`: Jumlah diskon yang diterapkan
- `referral_code`: Kode referral yang digunakan
- `referral_owner_id`: User ID pemilik kode referral

---

## 🔧 Backend Implementation

### File Structure
```
server/
  ├── referral.ts             # Core referral logic
  └── routes.ts               # API endpoints

shared/
  └── schema.ts               # Database schema

migrations/
  └── add_referral_system.sql # Migration SQL
```

### API Endpoints

#### 1. Get User's Referral Code
```
GET /api/referral/my-code
Auth: Required (isAuthenticated)

Response:
{
  "code": "STORIFY-ABC123"
}
```

#### 2. Get Referral Stats
```
GET /api/referral/stats
Auth: Required

Response:
{
  "code": "STORIFY-ABC123",
  "totalUsage": 5,
  "discountPercent": 10
}
```

#### 3. Validate Referral Code
```
POST /api/referral/validate
Auth: Required

Request:
{
  "code": "STORIFY-XYZ789"
}

Response (Success):
{
  "valid": true,
  "discountPercent": 10,
  "ownerId": "user123",
  "message": "Diskon 10% akan diterapkan"
}

Response (Error):
{
  "valid": false,
  "discountPercent": 0,
  "ownerId": null,
  "message": "Kode referral tidak valid"
}
```

### Validation Rules
Kode referral **TIDAK VALID** jika:
- ❌ Kode kosong atau tidak ditemukan
- ❌ User mencoba pakai kode sendiri
- ❌ Kode sudah tidak aktif (`is_active = false`)
- ❌ Kode sudah kadaluarsa (`expires_at < now`)
- ❌ Kode sudah mencapai batas penggunaan (`usage_count >= max_usage`)

---

## 💻 Frontend Implementation

### React Hooks

#### `useMyReferralCode()`
Fetch kode referral user yang sedang login.

```tsx
import { useMyReferralCode } from "@/hooks/use-subscription";

function MyProfile() {
  const { data } = useMyReferralCode();
  
  return <p>Kode Anda: {data?.code}</p>;
}
```

#### `useReferralStats()`
Fetch statistik penggunaan kode referral.

```tsx
const { data } = useReferralStats();
console.log(data?.totalUsage); // Berapa kali kode digunakan
```

#### `useValidateReferralCode()`
Validasi kode referral sebelum payment.

```tsx
const validateReferral = useValidateReferralCode();

const handleValidate = async () => {
  const result = await validateReferral.mutateAsync("STORIFY-ABC123");
  if (result.valid) {
    console.log(`Diskon ${result.discountPercent}%`);
  }
};
```

#### `useCreateQrisPayment()` (updated)
Sekarang menerima referral code sebagai parameter.

```tsx
const createPayment = useCreateQrisPayment();

await createPayment.mutateAsync({
  planId: 2,
  referralCode: "STORIFY-ABC123" // Optional
});
```

### UI Components

**QrisPayment Component** sudah diupdate dengan:
- ✅ Input field untuk kode referral
- ✅ Tombol validasi kode
- ✅ Preview diskon setelah kode divalidasi
- ✅ Harga dicoret + harga baru dengan diskon
- ✅ Badge "Hemat Rp X" pada plan cards
- ✅ Info diskon di QR Code display

---

## 🎯 User Flow

### 1. Menggunakan Kode Referral

```
User → Buka Subscription Page
     → Click "Punya Kode Referral? Masukkan Kode"
     → Input kode (e.g., STORIFY-ABC123)
     → Click "Validasi"
     → Lihat diskon 10% diterapkan di semua plan
     → Pilih plan
     → Bayar dengan harga diskon
     → Kode usage_count bertambah 1
```

### 2. Membagikan Kode Referral (Future Feature)

```
User → Profile Page (TODO: implement)
     → Lihat kode referral: "STORIFY-XYZ789"
     → Copy & share ke teman
     → Teman pakai kode → user dapat benefit (Future: reward/commission)
```

---

## 💰 Discount Calculation

```typescript
const originalAmount = 49000; // Harga plan Bulanan
const discountPercent = 10;

const discountAmount = Math.floor(originalAmount * discountPercent / 100);
// discountAmount = 4900

const finalAmount = originalAmount - discountAmount;
// finalAmount = 44100
```

**Contoh Harga dengan Diskon 10%:**
- Mingguan: **Rp 15.000** → **Rp 13.500** (hemat Rp 1.500)
- Bulanan: **Rp 49.000** → **Rp 44.100** (hemat Rp 4.900)
- Tahunan: **Rp 399.000** → **Rp 359.100** (hemat Rp 39.900)

---

## 🚀 Deployment

### 1. Jalankan Migration
```bash
psql -h localhost -U storify_user -d storify_db -f migrations/add_referral_system.sql
```

### 2. Restart Server
```bash
# Development
npm run dev

# Production
systemctl restart storify
```

### 3. Test di Browser
1. Login ke aplikasi
2. Buka page subscription/premium
3. Coba input kode referral
4. Pastikan validasi bekerja
5. Coba bayar dengan kode valid

---

## 🧪 Testing

### Manual Testing Checklist

#### Backend Tests
```bash
# 1. Get my referral code
curl -X GET http://localhost:5000/api/referral/my-code \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# 2. Validate code (should fail - using own code)
curl -X POST http://localhost:5000/api/referral/validate \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"code":"STORIFY-ABC123"}'

# 3. Create payment with referral
curl -X POST http://localhost:5000/api/qris/payment/create \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"planId":2,"referralCode":"STORIFY-XYZ789"}'
```

#### Frontend Tests
- [ ] Kode referral input muncul di subscription page
- [ ] Validasi berhasil dengan kode valid
- [ ] Validasi gagal dengan kode invalid
- [ ] Validasi gagal saat pakai kode sendiri
- [ ] Harga berubah setelah kode divalidasi
- [ ] Badge "Hemat Rp X" muncul di plan cards
- [ ] QR code display menampilkan harga diskon
- [ ] Payment berhasil dengan kode referral

---

## 🔐 Security Notes

- ✅ Kode referral di-uppercase otomatis
- ✅ User tidak bisa pakai kode sendiri
- ✅ Validasi di backend (tidak bisa bypass dari frontend)
- ✅ Usage count increment hanya setelah payment berhasil dibuat
- ✅ Kode bisa di-disable/expire oleh admin

---

## 🚧 Future Enhancements

### 1. Reward System for Referrer
Track siapa yang pakai kode referral untuk memberikan reward ke pemilik kode:
```sql
CREATE TABLE referral_rewards (
  id SERIAL PRIMARY KEY,
  referrer_user_id TEXT NOT NULL,
  referee_user_id TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  transaction_id INTEGER NOT NULL,
  reward_type TEXT, -- 'free_days', 'cashback', 'points'
  reward_value INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Admin Dashboard
- View semua referral codes
- Lihat top referrers (most used codes)
- Create custom referral codes untuk campaign
- Set expiration dates
- Deactivate codes

### 3. Referral Analytics
```typescript
interface ReferralAnalytics {
  totalReferrals: number;
  totalRevenue: number;
  topReferrers: Array<{
    userId: string;
    code: string;
    usageCount: number;
    revenue: number;
  }>;
}
```

### 4. Custom Discount Percentages
Allow admin to create codes with different discount rates:
- New user promo: 20% off
- Seasonal promo: 15% off
- VIP codes: 25% off

---

## 📝 Code Generation Logic

Format: `STORIFY-{6_RANDOM_CHARS}`

Contoh:
- `STORIFY-A1B2C3`
- `STORIFY-XYZ789`
- `STORIFY-QWE456`

**Character set:** `A-Z` dan `0-9` (36 kemungkinan per karakter)
**Total kombinasi:** 36^6 = 2,176,782,336 kombinasi unik

Collision handling: Jika kode sudah ada, generate ulang (sangat jarang terjadi).

---

## ❓ FAQ

**Q: Apakah kode referral bisa digunakan berulang?**
A: Ya, kecuali ada `max_usage` yang di-set. Default adalah unlimited.

**Q: Apakah diskon berlaku untuk semua plan?**
A: Ya, diskon 10% berlaku untuk plan Mingguan, Bulanan, dan Tahunan.

**Q: Apakah bisa pakai kode sendiri?**
A: Tidak, sistem akan reject jika user mencoba pakai kode sendiri.

**Q: Bagaimana cara dapat kode referral?**
A: Setiap user yang login otomatis punya kode referral unik. Akses via API `/api/referral/my-code`.

**Q: Apakah kode bisa kadaluarsa?**
A: Ya, jika `expires_at` di-set. Saat ini default adalah tidak ada expiration.

---

## 🎉 Summary

✅ **Backend:** Complete dengan validation, tracking, dan discount calculation
✅ **Frontend:** UI lengkap untuk input, validate, dan preview discount
✅ **Database:** Migration ready untuk production deployment
✅ **Testing:** Manual testing checklist tersedia
✅ **Documentation:** Comprehensive guide untuk developer

**Next Steps:**
1. Deploy migration ke production DB
2. Test di staging environment
3. Deploy ke production
4. Monitor usage via logs/analytics
5. Implement reward system (future)

---

**Happy Coding! 🚀**
