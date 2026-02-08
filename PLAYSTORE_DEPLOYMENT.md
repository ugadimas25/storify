# 📱 Panduan Upload Aplikasi ke Google Play Store

Panduan lengkap untuk upload aplikasi Android Storify ke Google Play Console dan publish ke Play Store.

---

## 📋 Prerequisites

### File yang Diperlukan

- ✅ **AAB File (Android App Bundle):** `release/storify-v1.0.aab` (2.97 MB)
- ✅ **APK File (untuk testing):** `release/storify-v1.0.apk` (3.16 MB)
- ✅ **App Icon (512x512):** `assets/icon-512.png`
- ⚠️ **Screenshots:** Belum ada (akan dibuat di langkah ini)
- ⚠️ **Privacy Policy:** Perlu dibuat/URL

### Akun yang Diperlukan

- **Google Play Console Account** ($25 one-time registration fee)
- **Google Account** (email Gmail)

---

## 🎯 Langkah 1: Membuat/Login Google Play Console

### 1.1. Registrasi Google Play Console (jika belum punya akun)

1. Buka: https://play.google.com/console
2. Klik **Sign Up** atau **Get Started**
3. Login dengan **Google Account** (Gmail)
4. Isi data developer:
   - **Developer name:** Intesa Global Technology (atau nama perusahaan/individu)
   - **Email address:** Email untuk kontak developer
   - **Phone number:** Nomor telepon
5. **Setuju** dengan Developer Distribution Agreement
6. Bayar **$25 USD** registration fee (one-time, tidak recurring)
   - Metode pembayaran: Credit Card / Debit Card
   - Proses: 5-10 menit
7. Tunggu konfirmasi email dari Google (biasanya instant)

### 1.2. Login (jika sudah punya akun)

1. Buka: https://play.google.com/console
2. Login dengan akun Google yang sudah registrasi
3. Pilih **Developer account** yang akan digunakan

---

## 📱 Langkah 2: Membuat Aplikasi Baru

### 2.1. Create New App

1. Di Google Play Console, klik **Create app** (tombol biru, kanan atas)

2. **App details:**
   - **App name:** `Storify` atau `Storify - Audiobook Summaries`
   - **Default language:** `English (United States) - en-US`
   - **App or game:** Pilih **App**
   - **Free or paid:** Pilih **Free** (gratis download)

3. **Declarations:**
   - Centang: ☑️ "I declare that this app complies with Google Play policies and laws"
   - Centang: ☑️ "I acknowledge that this app is subject to U.S. export laws"

4. Klik **Create app**

---

## 📝 Langkah 3: Setup Dashboard

Setelah app dibuat, akan ada **Dashboard** dengan checklist task. Kita akan isi satu per satu.

### 3.1. Set Up Your App

#### A. App Access

1. Klik **App access** di dashboard
2. Pilih salah satu:
   - **All functionality is available without special access** (jika app tidak butuh login untuk fungsi dasar)
   - **All or some functionality is restricted** (jika app butuh login/subscription)
   
   **Untuk Storify:** Pilih **"All or some functionality is restricted"**
   - Alasan: Fitur premium (audio unlimited) butuh login & subscription
   
3. Isi instruksi untuk reviewer (jika ada restricted features):
   ```
   Test Account:
   Email: dimas.perceka@sustainit.id
   Password: [masukkan password test account]
   
   Note: This account has premium subscription access.
   Free users can access 5 minutes of audio per day.
   ```

4. Klik **Save**

#### B. Ads

1. Klik **Ads** di dashboard
2. Pilih:
   - **No, my app does not contain ads** (jika tidak ada iklan)
   - **Yes, my app contains ads** (jika ada iklan)
   
   **Untuk Storify:** Pilih **"No"** (tidak ada iklan saat ini)

3. Klik **Save**

#### C. Content Ratings

1. Klik **Content ratings**
2. Isi **Email address** untuk kontak content rating
3. **Start questionnaire**

4. **Category:** Pilih **Utility, productivity, communication, other**

5. Jawab pertanyaan (untuk Storify):
   - Violence: **No**
   - Sexuality: **No**
   - Language: **No**
   - Controlled Substances: **No**
   - Gambling: **No**
   - User-generated content: **No** (konten buku sudah dikurasi)
   - User interaction: **Users can interact with each other** → **No**
   - Shares personal information: **No** (data user tidak dishare ke publik)
   - Digital purchases: **Yes** (subscription premium)

6. **Calculate rating** → Klik **Submit**
7. Rating biasanya: **PEGI 3** (Everyone), **ESRB E** (Everyone), **USK 0+**

#### D. Target Audience

1. Klik **Target audience** di dashboard
2. **Target age:** Pilih umur target user
   - **Untuk Storify:** Centang **18+** (dewasa, karena business/personal development content)
3. Klik **Save**

#### E. News Apps (skip jika bukan news app)

1. Klik **News apps**
2. Pilih: **No, my app is not a news app**
3. Klik **Save**

#### F. COVID-19 Contact Tracing and Status Apps (skip)

1. Klik link ini
2. Pilih: **No**
3. Klik **Save**

#### G. Data Safety

1. Klik **Data safety** di dashboard
2. Pilih data yang dikumpulkan app:

**Data Types Collected (untuk Storify):**

- ☑️ **Personal Info:**
  - Email address (untuk login/signup)
  - Name (untuk profile)
  
- ☑️ **App activity:**
  - App interactions (listening history, favorites)

- **Financial info:** Jika pakai DOKU payment:
  - ☑️ Payment info (processed by DOKU, not stored in app)

3. **Data usage:** Pilih **for app functionality**

4. **Data sharing:** 
   - Pilih: **Yes, we share user data with third parties**
   - Third parties: DOKU (payment processor), Tencent COS (audio storage)

5. **Data security:**
   - ☑️ Data is encrypted in transit (HTTPS)
   - ☑️ Users can request data deletion (via email/profile)

6. Klik **Save**

---

## 🖼️ Langkah 4: App Content & Store Listing

### 4.1. Store Listing

1. Klik **Main Store Listing** (di sidebar kiri, bawah "Grow")

#### A. App Details

**App name:**
```
Storify - Audiobook Summaries
```

**Short description (80 chars max):**
```
Dengarkan ringkasan buku terbaik. Belajar lebih cepat, lebih cerdas.
```

**Full description (4000 chars max):**
```
📚 Storify - Dengarkan Ringkasan Buku Terbaik

Tidak punya waktu untuk membaca buku penuh? Storify hadirkan solusinya! Dengarkan ringkasan buku-buku terbaik dunia dalam bahasa Indonesia, langsung dari HP kamu.

✨ FITUR UNGGULAN
• 1000+ ringkasan buku berkualitas
• Audio profesional untuk setiap buku
• Kategori lengkap: Business, Self-Improvement, Finance, Leadership
• Bookmark & favorites untuk akses cepat
• Listening history - track progress belajar kamu

🎯 KENAPA PILIH STORIFY?
✓ Hemat Waktu - Selesaikan 1 buku dalam 15-20 menit
✓ Multitasking - Dengarkan sambil commute, olahraga, atau santai
✓ Konten Berkualitas - Ringkasan dibuat oleh ahli
✓ Update Rutin - Buku baru ditambahkan setiap minggu

📖 KATEGORI POPULER
• Personal Development
• Business & Entrepreneurship
• Finance & Investment
• Leadership & Management
• Psychology & Mindfulness
• Health & Wellness

🎧 PERFECT UNTUK:
• Profesional yang sibuk
• Entrepreneur & business owner
• Mahasiswa & lifelong learners
• Siapa saja yang ingin terus belajar

💎 PAKET PREMIUM
Akses unlimited ke semua audiobook dengan fitur:
• Unlimited listening time
• Download untuk offline
• Priority customer support
• Early access ke buku baru

🆓 COBA GRATIS
Free users dapat mendengarkan hingga 5 menit per hari. Daftar sekarang dan mulai perjalanan belajar kamu!

📞 BUTUH BANTUAN?
Email: support@storify.asia
Website: https://storify.asia

Download sekarang dan ubah cara kamu belajar! 🚀
```

#### B. App Icon

1. Upload **app icon** (512x512 PNG):
   - File: `assets/icon-512.png`
   - Klik **Upload** di bagian "App icon"
   - Pilih file, upload

#### C. Feature Graphic

**Feature graphic diperlukan** (1024 x 500 px)

Buat feature graphic dengan tool online atau Canva:
- Ukuran: **1024 x 500 px**
- Background: #1a1a2e (dark blue)
- Logo Storify di center
- Teks: "Dengarkan Ringkasan Buku Terbaik"

**Cara buat cepat di Canva:**
1. Buka https://www.canva.com
2. Custom size: 1024 x 500 px
3. Background color: #1a1a2e
4. Upload logo Storify (`assets/logo.png`)
5. Tambahkan teks tagline
6. Download as PNG
7. Upload ke Play Console

#### D. Screenshots (WAJIB - minimal 2 screenshots)

**Phone Screenshots (minimal 2, max 8):**
- Ukuran: 320-3840 px (lebar/tinggi)
- Aspect ratio: 16:9 atau 9:16
- Format: PNG atau JPEG

**Cara ambil screenshot dari emulator:**

1. Jalankan app di Android Studio emulator
2. Navigate ke berbagai halaman (Explore, Book Detail, Audio Player, Profile)
3. Di emulator, klik **ikon Camera** (📷) di toolbar kanan
4. Screenshot tersimpan otomatis

**Screenshot yang dibutuhkan (minimal 2):**
- Screenshot 1: **Home/Explore page** (daftar buku dengan kategori)
- Screenshot 2: **Book Detail page** (detail buku dengan play button)
- Screenshot 3 (opsional): **Audio Player** (sedang play audio)
- Screenshot 4 (opsional): **Profile/Premium page**

Upload screenshots:
1. Di bagian **Phone screenshots**, klik **Upload**
2. Pilih 2-8 screenshots
3. Drag & drop untuk atur urutan

#### E. Video (Opsional)

Jika punya video demo app, upload YouTube link di sini.

#### F. Contact Details

**Email:** `support@storify.asia` atau email support kamu

**Phone:** (opsional) nomor telepon customer support

**Website:** `https://storify.asia`

#### G. Privacy Policy

**WAJIB** untuk app yang collect user data.

**Cara buat Privacy Policy cepat:**

1. Gunakan generator: https://www.privacypolicygenerator.info/
2. Atau buat sendiri, hosting di website
3. Minimal harus include:
   - Data yang dikumpulkan (email, nama, listening history)
   - Cara data digunakan
   - Third-party services (DOKU, Tencent COS)
   - User rights (akses, hapus data)
   - Contact info

**Contoh Privacy Policy URL:**
```
https://storify.asia/privacy-policy
```

Buat file HTML sederhana dan host di production server:

```html
<!-- /var/www/storify/dist/public/privacy-policy.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Privacy Policy - Storify</title>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #1a1a2e; }
    h2 { color: #333; margin-top: 30px; }
  </style>
</head>
<body>
  <h1>Privacy Policy for Storify</h1>
  <p>Last updated: February 8, 2026</p>
  
  <h2>1. Information We Collect</h2>
  <p>We collect the following information:</p>
  <ul>
    <li>Email address and name (for account creation)</li>
    <li>Listening history and favorites (for app functionality)</li>
    <li>Payment information (processed securely by DOKU)</li>
  </ul>
  
  <h2>2. How We Use Your Information</h2>
  <p>We use your information to:</p>
  <ul>
    <li>Provide and improve our services</li>
    <li>Process subscription payments</li>
    <li>Send important updates and notifications</li>
  </ul>
  
  <h2>3. Data Sharing</h2>
  <p>We share data with:</p>
  <ul>
    <li>DOKU - Payment processing</li>
    <li>Tencent Cloud - Audio file storage and delivery</li>
  </ul>
  
  <h2>4. Your Rights</h2>
  <p>You have the right to:</p>
  <ul>
    <li>Access your personal data</li>
    <li>Request data deletion</li>
    <li>Opt-out of marketing communications</li>
  </ul>
  
  <h2>5. Contact Us</h2>
  <p>For privacy inquiries: support@storify.asia</p>
</body>
</html>
```

Upload file ini ke server, lalu akses via `https://storify.asia/privacy-policy.html`

Paste URL ke field **Privacy policy URL** di Play Console.

4. Klik **Save**

---

## 📦 Langkah 5: Upload AAB (App Bundle)

### 5.1. Create Release

1. Di sidebar kiri, klik **Production** (bawah "Release")
2. Klik **Create new release**

### 5.2. Upload AAB

1. Klik **Upload** di bagian "App bundles"
2. Pilih file: `release/storify-v1.0.aab` (2.97 MB)
3. Tunggu upload selesai (1-2 menit)
4. Setelah upload, Google akan scan/analyze AAB:
   - ✅ No issues found: Lanjut
   - ⚠️ Warnings: Baca warning, biasanya opsional
   - ❌ Errors: Fix error dulu sebelum lanjut

### 5.3. Release Notes

**Release name:** `1.0` (auto-generated)

**Release notes (what's new - per language):**

**English (United States):**
```
Initial release of Storify!

Features:
• 1000+ audiobook summaries
• Professional audio narration
• Categories: Business, Personal Development, Finance, Leadership
• Bookmark and favorites
• Premium subscription for unlimited access
• Free users: 5 minutes listening per day

Enjoy learning! 🚀
```

**Indonesian (Bahasa Indonesia):**
```
Rilis perdana Storify!

Fitur:
• 1000+ ringkasan audiobook
• Audio narasi profesional
• Kategori: Business, Personal Development, Finance, Leadership
• Bookmark dan favorit
• Langganan premium untuk akses unlimited
• User gratis: 5 menit mendengarkan per hari

Selamat belajar! 🚀
```

### 5.4. Review Release

1. Scroll ke bawah
2. Review semua informasi (AAB size, version code, SDK versions)
3. Jika sudah OK, klik **Save**
4. Klik **Review release**

---

## 🚀 Langkah 6: Submit for Review

### 6.1. Final Checklist

Pastikan semua task di dashboard sudah ✅:
- ✅ App access
- ✅ Ads
- ✅ Content ratings
- ✅ Target audience
- ✅ Data safety
- ✅ Store listing (name, description, icon, screenshots, privacy policy)
- ✅ Production release (AAB uploaded)

### 6.2. Submit

1. Jika semua task sudah complete, klik **Send for review** atau **Start rollout to Production**
2. Konfirmasi: **Send** atau **Rollout**

---

## ⏳ Langkah 7: Menunggu Review

### Review Timeline

- **Typical review time:** 2-7 hari kerja
- **Fast review:** 1-2 hari (jika app simple dan no issues)
- **Slow review:** Hingga 7-14 hari (jika ada komplain atau perlu klarifikasi)

### Status Review

**Cek status review:**
1. Login Play Console
2. Dashboard akan show status: **In review**, **Approved**, atau **Rejected**

**Status yang mungkin:**
- 🟡 **Pending publication** - Menunggu review
- 🔵 **In review** - Sedang direview Google
- ✅ **Approved & Published** - Live di Play Store!
- ❌ **Rejected** - Ada masalah, perlu diperbaiki

### Jika Rejected

Google akan kirim email dengan alasan rejection. Common issues:
- Privacy policy tidak lengkap/tidak accessible
- Screenshots tidak representatif
- App crash saat reviewer test
- Metadata menyesatkan (title/description)
- Melanggar policy (malware, copyright, dll)

**Fix & resubmit:**
1. Perbaiki issue sesuai feedback
2. Upload AAB baru (jika perlu)
3. Update store listing (jika perlu)
4. Submit ulang untuk review

---

## 🎉 Langkah 8: App Published!

Setelah approved:
- ✅ App akan live di Play Store dalam 1-2 jam
- ✅ Users bisa cari dan download: "Storify"
- ✅ Direct link: `https://play.google.com/store/apps/details?id=asia.storify.app`

### Monitoring

**Play Console Dashboard:**
- **Statistics:** Downloads, active users, crashes
- **Ratings & reviews:** User feedback
- **Pre-launch reports:** Automated testing results
- **Android vitals:** Performance metrics (ANR, crashes)

**Update App:**
1. Increment version di `android/app/build.gradle`:
   ```gradle
   versionCode 2  // naik dari 1
   versionName "1.1"
   ```
2. Build new AAB: `cd android; ./gradlew bundleRelease`
3. Upload ke Production release baru
4. Add release notes (what's new)
5. Submit for review

---

## 📋 Checklist Akhir

Sebelum submit, pastikan:

- [ ] Google Play Console account sudah bayar $25
- [ ] App name final & tidak melanggar trademark
- [ ] App icon 512x512 uploaded
- [ ] Feature graphic 1024x500 uploaded
- [ ] Minimal 2 phone screenshots uploaded
- [ ] Description lengkap dan menarik
- [ ] Privacy policy URL valid dan accessible
- [ ] Contact email valid (support@storify.asia)
- [ ] AAB file uploaded (storify-v1.0.aab)
- [ ] Release notes ditulis
- [ ] Content rating complete
- [ ] Data safety complete
- [ ] Test account credentials provided (untuk premium features)
- [ ] All dashboard tasks ✅ complete

---

## 🆘 Troubleshooting

### Upload AAB Gagal

**Error: "Upload failed"**
- Check ukuran AAB tidak > 150 MB
- Check koneksi internet
- Try upload ulang

**Error: "You uploaded a debuggable APK"**
- Pastikan build dengan `assembleRelease`, bukan `assembleDebug`
- Check `build.gradle` ada `buildTypes.release`

**Error: "You need to use a different package name"**
- Package name `asia.storify.app` sudah dipakai orang lain
- Ganti di `capacitor.config.ts` dan `AndroidManifest.xml`
- Rebuild AAB

### Review Rejection: "Misleading Store Listing"

- Pastikan screenshots actual dari app (bukan mockup)
- Description jangan exaggerated (no "best", "number 1", dll tanpa bukti)
- Icon tidak mirip app lain

### Review Rejection: "Privacy Policy"

- Privacy policy tidak bisa diakses (404, HTTPS error)
- Privacy policy tidak cover semua data collection
- Privacy policy tidak ada contact info

**Fix:**
- Host privacy policy di `https://storify.asia/privacy-policy`
- Test access dari incognito browser
- Tambahkan semua data yang collected
- Tambahkan email contact: support@storify.asia

### App Crashes During Review

Google punya automated testing. Jika app crash, akan rejected.

**Fix:**
- Test app extensively di emulator berbagai API level
- Check Logcat untuk crash errors
- Fix crash, rebuild AAB, resubmit

---

## 🎯 Tips untuk Review Cepat

1. **Complete semua field** - Jangan skip opsional fields
2. **Quality screenshots** - Clear, HD, menunjukkan core features
3. **Test account** - Provide valid test credentials untuk premium features
4. **Responsive support** - Check email reguler, respond cepat kalau Google minta klarifikasi
5. **No policy violations** - Double check app tidak melanggar content policy
6. **Working links** - Test privacy policy URL, website URL

---

## 📚 Resources

- **Google Play Console:** https://play.google.com/console
- **Developer Policy Center:** https://play.google.com/about/developer-content-policy/
- **App Signing Guide:** https://developer.android.com/studio/publish/app-signing
- **Play Console Help:** https://support.google.com/googleplay/android-developer

---

**Good luck dengan submission! 🚀**

Jika ada pertanyaan atau stuck di step manapun, jangan ragu tanya!
