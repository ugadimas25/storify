# Tencent COS CORS Configuration

## Problem
Error `net::ERR_BLOCKED_BY_ORB` atau **"Failed to load PDF file"** terjadi saat browser mencoba load assets (images, PDFs, audio) dari COS bucket `pewacaold-1379748683`.

## Solution
Anda perlu mengkonfigurasi CORS (Cross-Origin Resource Sharing) di Tencent COS Console.

## Steps:

### 1. Login ke Tencent Cloud Console
- Go to: https://console.cloud.tencent.com/cos
- Pilih bucket: `pewacaold-1379748683`

### 2. Configure CORS
- Klik tab **Security Management** atau **安全管理**
- Klik **CORS Configuration** atau **跨域访问CORS设置**
- Klik **Add Rule** atau **添加规则**

### 3. Add CORS Rule
Tambahkan rule dengan konfigurasi berikut:

```json
{
  "AllowedOrigins": ["*"],
  "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag", "Content-Length", "Content-Type", "Content-Range", "Accept-Ranges"],
  "MaxAgeSeconds": 3600
}
```

**Atau dalam UI form:**
- **Origin**: `*` (atau domain spesifik Anda, misalnya `https://storify.asia`)
- **Methods**: Centang `GET`, `HEAD`, dan `OPTIONS`
- **Allow-Headers**: `*`
- **Expose-Headers**: `ETag, Content-Length, Content-Type, Content-Range, Accept-Ranges`
- **Max-Age**: `3600`

### 4. Save Configuration
- Klik **Save** atau **保存**
- Tunggu beberapa menit untuk propagasi

### 5. Test
Refresh aplikasi Anda dan assets (images, audio, PDFs) seharusnya sudah bisa dimuat.

## Alternative: Bucket Permission
Jika CORS sudah benar tapi masih error, pastikan bucket permission:
- Set bucket ke **Public Read** atau **公有读私有写**
- Path: Bucket List → Select Bucket → Permission Management → Bucket ACL

## Verification
Setelah CORS dikonfigurasi, Anda bisa verifikasi dengan cURL:

**Test Image:**
```bash
curl -I https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/image/774.jpg \
  -H "Origin: https://storify.asia"
```

**Test PDF:**
```bash
curl -I https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/pdf/774.pdf \
  -H "Origin: https://storify.asia"
```

Harusnya ada response header seperti ini:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Content-Type: application/pdf
Accept-Ranges: bytes
```

## Verify PDF File Exists
Pastikan file PDF sudah terupload di COS:
```bash
# Check if PDF exists
curl -I https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/pdf/774.pdf
```

Jika return `404 Not Found`, file PDF belum diupload. Upload dengan script:
```bash
npm run upload:pdf
```

## Notes
- **Images**: `https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/image/{ID}.{ext}`
- **Audio**: `https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/{ID}.mp3`
- **PDF**: `https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/pdf/{ID}.pdf`
- Extension mapping untuk images ada di `server/cover-extensions.ts`
- PDF files harus di folder `pdf/` di COS bucket
