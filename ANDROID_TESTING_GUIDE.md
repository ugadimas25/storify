# 📱 Panduan Testing Aplikasi Android Storify

Panduan lengkap untuk testing aplikasi Android Storify di Android Studio, cocok untuk pemula yang belum pernah menggunakan Android Studio.

---

## 📋 Prerequisites

### 1. Instalasi yang Diperlukan

- ✅ **Android Studio** (sudah terinstall)
- ✅ **Java JDK 21** (sudah terinstall di: `C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot`)
- ✅ **Project sudah dibuka** (via `npx cap open android`)

### 2. Pastikan Build Berhasil

Sebelum testing, pastikan production server sudah selesai deploy:

```bash
# SSH ke server production
ssh root@<IP_SERVER>
cd /var/www/storify

# Install dependencies dan build
npm ci --production=false
npm run build

# Restart service
systemctl restart storify

# Verifikasi server jalan
curl -s https://storify.asia/api/books | head -c 100
```

---

## 🚀 Langkah 1: Membuka Project di Android Studio

### Jika Android Studio Belum Terbuka

1. Buka **Android Studio** dari Start Menu
2. Pilih **Open** di welcome screen
3. Navigate ke folder: `D:\b_outside\a_intesa_global_technology\Storify\Storify-Insights\Storify-Insights\android`
4. Klik **OK**

### Jika Project Sudah Terbuka (via `npx cap open android`)

- Langsung lanjut ke langkah berikutnya

### Tunggu Gradle Sync Selesai

1. Setelah project terbuka, Android Studio akan otomatis menjalankan **Gradle Sync**
2. Lihat di **status bar bawah** ada tulisan "Syncing...", "Building..." atau "Indexing..."
3. **Tunggu hingga selesai** (bisa 1-5 menit, tergantung kecepatan laptop)
4. Jika muncul popup **Trust Project**, klik **Trust Project**
5. Jika muncul error "SDK not found", klik **File → Project Structure → SDK Location** dan pastikan path sudah benar

> **Tanda Gradle Sync Selesai:**
> - Status bar bawah kosong atau muncul "Ready"
> - Tidak ada loading bar di bawah
> - Tidak ada error di panel **Build** (bawah)

---

## 📱 Langkah 2: Setup Device untuk Testing

Anda bisa memilih salah satu dari 2 opsi:

### **OPSI A: Menggunakan Emulator (Recommended untuk Pemula)** ✅

#### 2.1. Buka Device Manager

1. Klik ikon **Device Manager** di toolbar kanan (ikon HP dengan logo Android)
   - Atau: **Tools → Device Manager** dari menu bar
2. Device Manager panel akan terbuka di sebelah kanan

#### 2.2. Cek Apakah Sudah Ada Emulator

- **Jika sudah ada device** di list (misalnya "Pixel 6 API 34"):
  - Klik tombol **▶️ (Play/Launch)** di samping device
  - Emulator akan terbuka (tunggu 30-60 detik)
  - Skip ke **Langkah 3**

- **Jika belum ada device** / list kosong:
  - Lanjut ke step 2.3

#### 2.3. Membuat Emulator Baru

1. Klik tombol **Create Device** (atau tanda **+** di Device Manager)

2. **Select Hardware:**
   - Pilih **Phone** di kategori kiri
   - Pilih device: **Pixel 6** atau **Pixel 6 Pro** (recommended)
   - Klik **Next**

3. **Select System Image:**
   - Tab **Recommended** akan terbuka
   - Pilih **Tiramisu (API 33)** atau **UpsideDownCake (API 34)**
   - Jika ada tulisan **Download** di samping: klik **Download**
     - Tunggu download selesai (500 MB - 1.5 GB, bisa 5-20 menit)
     - Klik **Finish** setelah download selesai
   - Setelah system image terinstall, pilih system image tersebut
   - Klik **Next**

4. **Verify Configuration:**
   - **AVD Name:** biarkan default (misalnya "Pixel 6 API 34")
   - **Startup orientation:** Portrait
   - **Advanced Settings** (opsional, untuk laptop yang lambat):
     - **RAM:** 2048 MB (untuk laptop dengan RAM terbatas)
     - **VM Heap:** 512 MB
     - **Internal Storage:** 2048 MB (cukup untuk testing)
   - Klik **Finish**

5. **Launch Emulator:**
   - Device baru akan muncul di Device Manager
   - Klik **▶️ (Play)** di samping device
   - Tunggu emulator boot (30-90 detik pertama kali)
   - Emulator akan muncul di window terpisah

> **Tips Emulator:**
> - Emulator akan sangat lambat di laptop spek rendah (< 8GB RAM)
> - Jika emulator crash atau sangat lambat, gunakan **Opsi B (HP Fisik)** atau reduce RAM emulator

---

### **OPSI B: Menggunakan HP Android Fisik** 📲

#### 2.1. Enable Developer Options di HP

1. Buka **Settings** (Pengaturan) di HP Android
2. Scroll ke bawah, pilih **About Phone** (Tentang Ponsel)
3. Cari **Build Number** (Nomor Build)
4. **Tap 7 kali** pada Build Number
5. Akan muncul popup "You are now a developer!" atau "Anda sekarang pengembang!"

#### 2.2. Enable USB Debugging

1. Kembali ke **Settings** → **System** (atau langsung di menu Settings)
2. Pilih **Developer Options** (Opsi Pengembang)
   - Jika tidak terlihat, coba cari di **Additional Settings** atau **System → Advanced**
3. **Aktifkan** toggle **Developer Options** (di atas)
4. Scroll ke bawah, cari **USB Debugging**
5. **Aktifkan** toggle **USB Debugging**
6. Klik **OK** di popup konfirmasi

#### 2.3. Sambungkan HP ke Laptop

1. Sambungkan HP ke laptop via **kabel USB**
2. Di HP akan muncul notifikasi "USB charging" atau "USB for file transfer"
3. Tap notifikasi tersebut, pilih **File Transfer (MTP)** atau **PTP**
4. Di HP akan muncul popup **"Allow USB debugging?"**
   - Centang **Always allow from this computer**
   - Klik **OK** / **Allow**

#### 2.4. Verifikasi Device Terdeteksi

1. Kembali ke Android Studio
2. Lihat di **toolbar atas**, ada dropdown device
3. Jika HP terdeteksi, akan muncul nama HP (misalnya "Samsung SM-A525F")
4. Jika tidak muncul:
   - Coba cabut dan colok ulang kabel USB
   - Pastikan USB Debugging sudah aktif
   - Restart Android Studio
   - Install **USB Driver** HP (download dari website manufacturer HP)

---

## ▶️ Langkah 3: Build dan Run Aplikasi

### 3.1. Pilih Device

1. Di **toolbar atas** Android Studio, ada dropdown device
2. Klik dropdown tersebut
3. Pilih device yang akan digunakan:
   - **Emulator:** Misalnya "Pixel 6 API 34" (dengan ikon emulator)
   - **HP Fisik:** Nama HP kamu (misalnya "Samsung SM-A525F")

### 3.2. Run Aplikasi

1. Klik tombol **Run ▶️** (hijau) di toolbar atas
   - Atau: Menu **Run → Run 'app'**
   - Atau: Tekan **Shift + F10** di keyboard

2. Android Studio akan mulai build:
   - Tab **Build** akan terbuka di bawah
   - Akan muncul progress bar "Building..." atau "Installing..."
   - **Tunggu hingga selesai** (pertama kali bisa 30-120 detik)

3. Output di tab **Build** yang normal:
   ```
   > Task :app:compileReleaseKotlin
   > Task :app:packageRelease
   > Task :app:assembleRelease
   BUILD SUCCESSFUL in 45s
   ```

4. Aplikasi akan otomatis terinstall dan terbuka di device/emulator

### 3.3. Jika Build Gagal

**Error: "SDK location not found"**
- Solusi: File → Project Structure → SDK Location
- Set Android SDK Location ke: `C:\Users\<USERNAME>\AppData\Local\Android\Sdk`
- Klik Apply → OK

**Error: "Kotlin version mismatch"**
- Solusi: File → Settings → Build, Execution, Deployment → Build Tools → Gradle
- Select "Use Gradle from: 'wrapper'" (default)
- Klik Apply → OK → Rebuild

**Error: "Execution failed for task ':app:mergeReleaseResources'"**
- Solusi: Build → Clean Project
- Lalu Build → Rebuild Project

**Error: "INSTALL_FAILED_INSUFFICIENT_STORAGE"**
- Solusi: Hapus beberapa app di emulator/HP untuk free up space
- Atau buat emulator baru dengan storage lebih besar

---

## ✅ Langkah 4: Testing Checklist

Setelah app terbuka di device/emulator, lakukan testing berikut:

### 4.1. Visual & Branding

- [ ] **App Icon:**
  - Tutup app (swipe up atau back ke home)
  - Lihat app icon di **home screen** atau **app drawer**
  - ✅ Harus logo **Storify** (buku terbuka + teks "STORIFY READ BY EAR")
  - ❌ Bukan robot hijau (default Capacitor icon)

- [ ] **Splash Screen:**
  - Tutup app (force stop)
  - Buka app lagi
  - ✅ Harus muncul splash screen: logo Storify di background **gelap (#1a1a2e)**
  - ✅ Splash screen hilang otomatis setelah 1-2 detik
  - ❌ Bukan splash screen putih dengan robot

- [ ] **Status Bar:**
  - Saat app terbuka, lihat status bar (atas)
  - ✅ Warna background status bar **gelap (#1a1a2e)**
  - ✅ Ikon status bar berwarna **putih**

### 4.2. Fungsionalitas Utama

- [ ] **Home/Explore Page:**
  - App terbuka langsung ke halaman Explore
  - ✅ Muncul **slider banner** di atas (jika ada)
  - ✅ Muncul **kategori buku** (Personal Development, Business, dll)
  - ✅ Muncul **daftar buku** dengan cover, judul, author
  - ❌ Tidak ada "Network Error" atau "Failed to fetch"

- [ ] **Navigation:**
  - Tap ikon **Home** di bottom navigation
  - ✅ Pindah ke halaman Home (Recently Played)
  - Tap ikon **Explore**
  - ✅ Pindah ke halaman Explore
  - Tap ikon **Favorites**
  - ✅ Pindah ke halaman Favorites (mungkin kosong jika belum login)
  - Tap ikon **Profile**
  - ✅ Pindah ke halaman Profile

- [ ] **Login Flow:**
  - Tap **Icon Profile** (kanan bawah)
  - Jika belum login, tap **Sign In**
  - ✅ Form login muncul (email & password)
  - Isi email: `dimas.perceka@sustainit.id`
  - Isi password: (password yang dipakai)
  - Tap **Sign In**
  - ✅ Login berhasil, redirect ke halaman Profile
  - ✅ Muncul nama user dan email

- [ ] **Book Detail:**
  - Tap salah satu **buku** di halaman Explore
  - ✅ Muncul halaman detail buku
  - ✅ Muncul cover buku besar
  - ✅ Muncul judul, author, rating, description
  - Scroll ke bawah
  - ✅ Muncul tombol audio (jika buku punya audio)

- [ ] **Audio Player (untuk user premium):**
  - Login dengan user premium: `dimas.perceka@sustainit.id`
  - Buka buku yang punya audio (cek di DB: books dengan `cos_filename IS NOT NULL`)
  - Tap tombol **Play** (▶️)
  - ✅ Audio player muncul di bawah
  - ✅ Audio mulai play (terdengar suara)
  - ✅ Progress bar bergerak
  - ✅ Bisa pause/resume
  - ✅ Bisa drag seekbar untuk skip
  - ✅ Tombol 15s backward/forward berfungsi

- [ ] **Back Button (Android):**
  - Buka halaman detail buku
  - Tekan tombol **Back** (hardware back button di HP/emulator)
  - ✅ Kembali ke halaman sebelumnya (Explore)
  - Tekan Back lagi di halaman utama
  - ✅ App **tidak menutup** (tetap di halaman terakhir)
  - Tekan Back terus sampai tidak bisa back lagi
  - ✅ Muncul konfirmasi "Exit app?" atau app menutup

---

## 🐛 Langkah 5: Troubleshooting

### Problem: App Crash Saat Dibuka

**Cek Logcat:**
1. Buka tab **Logcat** di bawah Android Studio (sebelah Build)
2. Filter by: **app name** atau **asia.storify.app**
3. Cari error berwarna **merah**

**Common Causes:**
- **"NetworkOnMainThreadException":** Sudah di-handle oleh Capacitor, seharusnya tidak terjadi
- **"CORS error":** Server production belum selesai deploy CORS middleware
- **"Failed to fetch":** Server production tidak bisa diakses
- **"TypeError: Cannot read property":** Bug di code, cek Logcat detail

**Solusi:**
- Pastikan server production sudah running dan accessible: `curl https://storify.asia/api/books`
- Pastikan CORS sudah di-deploy dan restart service
- Check internet connection emulator/HP

---

### Problem: Daftar Buku Tidak Muncul

**Kemungkinan Penyebab:**
1. **Server production belum selesai deploy**
   - Verifikasi: `curl https://storify.asia/api/books`
   - Solusi: Selesaikan deploy di server

2. **CORS belum aktif**
   - Cek di Logcat: ada error "CORS" atau "blocked by CORS policy"
   - Solusi: Deploy CORS middleware, restart server

3. **Database kosong**
   - Verifikasi: Login ke DB production, cek `SELECT COUNT(*) FROM books;`
   - Solusi: Import buku dengan `npm run import-books` di server

4. **Internet issue**
   - Pastikan emulator/HP ada koneksi internet
   - Emulator: Check WiFi icon di status bar emulator
   - HP Fisik: Pastikan WiFi atau mobile data aktif

---

### Problem: Audio Tidak Bisa Play

**Kemungkinan Penyebab:**
1. **User belum premium**
   - Hanya user premium yang bisa play unlimited audio
   - Free user cuma bisa 5 menit/hari
   - Solusi: Login dengan `dimas.perceka@sustainit.id` (sudah di-whitelist premium)

2. **Buku tidak punya audio**
   - Hanya 89 buku yang punya audio COS (dari 1274 buku total)
   - Verifikasi: Check DB: `SELECT title FROM books WHERE cos_filename IS NOT NULL;`
   - Solusi: Pilih buku yang benar-benar punya audio

3. **COS URL tidak bisa diakses**
   - Cek network_security_config.xml sudah include COS domain
   - Sudah include: `storify-1256058106.cos.ap-beijing.myqcloud.com`

4. **Permission issue**
   - Android 13+ perlu permission audio
   - Sudah di-handle oleh Capacitor secara otomatis

---

### Problem: Emulator Sangat Lambat

**Solusi:**

1. **Reduce Emulator RAM:**
   - Device Manager → ⋮ (menu 3 titik) → Edit emulator
   - Advanced Settings → RAM: 2048 MB
   - Boot time: 512 MB
   - Save

2. **Enable Hardware Acceleration:**
   - Pastikan Intel HAXM terinstall (untuk Intel CPU)
   - Atau AMD-V aktif di BIOS (untuk AMD CPU)
   - Restart laptop setelah enable

3. **Close Background Apps:**
   - Tutup Chrome, VS Code, dan app berat lainnya saat testing

4. **Gunakan HP Fisik:**
   - Lebih cepat dan reliable daripada emulator
   - Lihat Opsi B di Langkah 2

---

## 📸 Screenshot Testing (Optional)

Untuk dokumentasi atau bug report, ambil screenshot:

1. **Di Emulator:**
   - Klik ikon **Camera** (📷) di toolbar emulator (kanan)
   - Screenshot tersimpan di: `Pictures/Screenshots/` di folder emulator

2. **Di HP Fisik:**
   - Power + Volume Down (untuk kebanyakan HP)
   - Screenshot tersimpan di galeri HP

---

## 🎉 Selesai!

Jika semua testing checklist ✅, aplikasi sudah siap untuk:
- Upload ke **Google Play Console** (file `release/storify-v1.0.aab`)
- Update icon/splash screen di kemudian hari
- Tambah fitur baru

---

## 📚 Resources Tambahan

- **Android Studio User Guide:** https://developer.android.com/studio/intro
- **Capacitor Android Guide:** https://capacitorjs.com/docs/android
- **Play Console Upload Guide:** https://support.google.com/googleplay/android-developer/answer/9859152

---

## 🆘 Butuh Bantuan?

Jika menemui masalah yang tidak tercantum di guide ini:

1. **Check Logcat** (tab Logcat di Android Studio) untuk error detail
2. **Screenshot error** di Android Studio atau device
3. **Copy error message** lengkap
4. **Tanyakan ke developer** dengan informasi di atas

---

**Happy Testing! 🚀**
