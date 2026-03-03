# Tencent COS CORS Configuration

## Problem
Error `net::ERR_BLOCKED_BY_ORB` terjadi saat browser mencoba load cover images dari COS bucket `pewacaold-1379748683`.

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
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
  "MaxAgeSeconds": 3600
}
```

**Atau dalam UI form:**
- **Origin**: `*` (atau domain spesifik Anda, misalnya `https://yourapp.com`)
- **Methods**: Centang `GET` dan `HEAD`
- **Allow-Headers**: `*`
- **Expose-Headers**: `ETag, Content-Length, Content-Type`
- **Max-Age**: `3600`

### 4. Save Configuration
- Klik **Save** atau **保存**
- Tunggu beberapa menit untuk propagasi

### 5. Test
Refresh aplikasi Anda dan cover images seharusnya sudah bisa dimuat.

## Alternative: Bucket Permission
Jika CORS sudah benar tapi masih error, pastikan bucket permission:
- Set bucket ke **Public Read** atau **公有读私有写**
- Path: Bucket List → Select Bucket → Permission Management → Bucket ACL

## Verification
Setelah CORS dikonfigurasi, Anda bisa verifikasi dengan cURL:

```bash
curl -I https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/image/2.jpg \
  -H "Origin: http://localhost:5000"
```

Harusnya ada response header seperti ini:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD
```

## Notes
- Cover images di-generate otomatis berdasarkan book ID
- Format: `https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/image/{ID}.{ext}`
- Extension mapping ada di `server/cover-extensions.ts`
