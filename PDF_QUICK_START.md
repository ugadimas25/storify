# 🚀 Quick Start: Menambahkan PDF ke Storify

Panduan praktis untuk menambahkan fitur baca buku PDF ke aplikasi Storify Insights.

---

## 📋 Prerequisites

✅ Database sudah running (PostgreSQL)  
✅ COS credentials sudah dikonfigurasi di `.env`  
✅ File PDF buku tersimpan di folder lokal  

---

## 🔧 Langkah 1: Update Database Schema

Jalankan migration untuk menambahkan kolom `pdf_url`:

```bash
# Option 1: Via Drizzle (recommended)
npm run db:push

# Option 2: Manual SQL (jika db:push gagal)
psql -h localhost -U storify_user -d storify_db -f migrations/add_pdf_url.sql
```

Verifikasi kolom sudah ditambahkan:

```sql
\d books_list
-- Harus ada kolom: pdf_url | text |
```

---

## 📁 Langkah 2: Siapkan File PDF

Kumpulkan semua file PDF buku di satu folder, contoh:

```
D:\b_outside\a_intesa_global_technology\Storify\pdf_books\
├── Atomic Habits - James Clear.pdf
├── Deep Work - Cal Newport.pdf
├── The Psychology of Money - Morgan Housel.pdf
└── ...
```

**💡 Tips Naming Convention:**
- Format ideal: `"Title - Author.pdf"`
- Atau: `"Title.pdf"` (jika author ada di database)
- Hindari: nomor urut, special characters berlebihan

---

## ☁️ Langkah 3: Upload PDF ke COS

Upload semua PDF ke Tencent Cloud Object Storage:

```bash
# Upload dari default folder
npm run upload:pdf

# Atau specify custom folder
npm run upload:pdf -- --dir "D:\path\to\your\pdfs"
```

Script akan:
- ✅ Upload semua PDF ke folder `/pdf/` di COS
- ✅ Skip file yang sudah ada (tidak re-upload)
- ✅ Generate report: `pdf-upload-report.json`

**Output Example:**
```
📚 Starting PDF files upload to Tencent COS...

[1/10] Atomic Habits - James Clear.pdf (2.3 MB)
   ✅ Success: https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/pdf/Atomic%20Habits%20-%20James%20Clear.pdf

[2/10] Deep Work - Cal Newport.pdf (1.8 MB)
   ✅ Success: https://...

✅ Success: 10
⏭️  Skipped: 0
❌ Failed: 0
```

---

## 🗄️ Langkah 4: Update Database dengan PDF URL

Match PDF yang sudah diupload dengan buku di database:

```bash
npm run update:pdf
```

Script akan:
- ✅ Baca `pdf-upload-report.json`
- ✅ Match PDF filename dengan book title (fuzzy matching)
- ✅ Update `books.pdf_url` untuk buku yang cocok
- ✅ Generate report: `pdf-update-results.json`

**Output Example:**
```
📚 Updating books with PDF URLs...

✅ Matched (95%): "Atomic Habits" ← Atomic Habits - James Clear.pdf
✅ Matched (92%): "Deep Work" ← Deep Work - Cal Newport.pdf
❌ No match: Some_Random_Book.pdf

✅ Updated:   8
⏭️  Skipped:   1
❌ Not found: 1
```

---

## 🎨 Langkah 5: Test di Browser

1. Jalankan dev server:
   ```bash
   npm run dev
   ```

2. Buka aplikasi di browser: `http://localhost:5001`

3. Cari buku yang sudah ditambahkan PDF-nya

4. Cek apakah:
   - ✅ Badge "PDF" muncul di book card
   - ✅ Tombol "Read Full Book" muncul di detail page
   - ✅ PDF reader berfungsi (bisa scroll, zoom, fullscreen)

---

## 🔄 Workflow Alternatif: Manual Update

Jika matching otomatis tidak sempurna, update manual via SQL:

```sql
-- Cek book ID
SELECT id, title, author FROM books_list WHERE title ILIKE '%atomic%';

-- Update specific book
UPDATE books_list 
SET pdf_url = 'https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/pdf/Atomic%20Habits%20-%20James%20Clear.pdf'
WHERE id = 123;

-- Verify
SELECT id, title, pdf_url FROM books_list WHERE pdf_url IS NOT NULL;
```

---

## 🐛 Troubleshooting

### ❌ Problem: "COS credentials not configured"

**Solution:**
```bash
# Check .env file
cat .env | grep COS

# Should have:
COS_SECRET_ID=your_secret_id
COS_SECRET_KEY=your_secret_key
COS_BUCKET=pewacaold-1379748683
COS_REGION=ap-jakarta
```

---

### ❌ Problem: "No matching book found"

**Possible causes:**
1. PDF filename tidak match dengan book title di database
2. Buku belum ada di database

**Solution:**
```bash
# Check current books
psql -h localhost -U storify_user -d storify_db \
  -c "SELECT id, title FROM books_list LIMIT 10;"

# Option 1: Rename PDF to match title
mv "wrong_name.pdf" "Correct Title - Author.pdf"

# Option 2: Add book to database first
# (Use import-books.ts or manual INSERT)
```

---

### ❌ Problem: "PDF reader shows blank"

**Possible causes:**
1. CORS issue (browser blocking)
2. PDF corrupted or invalid
3. File too large (>50MB)

**Solution:**
```bash
# Test PDF URL directly in browser
https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/pdf/YourBook.pdf

# Check COS CORS config (should allow GET from your domain)
# See: COS_CORS_CONFIG.md

# Compress large PDF
# Use Adobe Acrobat or online tool to reduce size
```

---

## 📊 Monitoring & Analytics

Track PDF usage in database:

```sql
-- Count books with PDF
SELECT COUNT(*) FROM books_list WHERE pdf_url IS NOT NULL;

-- List all books with PDF
SELECT id, title, author, pdf_url 
FROM books_list 
WHERE pdf_url IS NOT NULL 
ORDER BY title;

-- Find popular PDF books (if you have activity logs)
SELECT b.title, COUNT(a.id) as views
FROM books_list b
JOIN activity_logs a ON a.resource_id = CAST(b.id AS TEXT) AND a.action = 'view_book'
WHERE b.pdf_url IS NOT NULL
GROUP BY b.id, b.title
ORDER BY views DESC
LIMIT 10;
```

---

## 🎯 Best Practices

### 1. **Optimize PDF File Size**
- Target: < 10MB per file
- Use PDF compressor tools
- Balance quality vs. size

### 2. **Consistent Naming**
- Follow format: `"Title - Author.pdf"`
- Remove special characters: `()[]{}!@#$%`
- Use underscore or dash: `_` or `-`

### 3. **Batch Processing**
- Upload semua PDF sekaligus (lebih efisien)
- Update database after all uploads complete

### 4. **Backup**
- Keep local copy of all PDFs
- COS is not a backup, it's a CDN

### 5. **Legal Compliance**
- Ensure you have rights to distribute PDFs
- Check copyright and licensing
- Use only legal/licensed content

---

## 🚀 Advanced: Automated Import

Update `import-books.ts` to auto-detect and match PDFs:

```typescript
// Add PDF matching logic
const pdfFilename = `${title} - ${author}.pdf`;
const pdfKey = `pdf/${pdfFilename}`;
const pdfExists = await fileExistsInCOS(pdfKey);

if (pdfExists) {
  book.pdfUrl = getCOSUrl(pdfKey);
}
```

Then run:
```bash
npm run tsx script/import-books.ts
```

---

## 📚 Related Documentation

- [PDF_FEATURE.md](PDF_FEATURE.md) - Full feature documentation
- [COS_CORS_CONFIG.md](COS_CORS_CONFIG.md) - CORS setup for COS
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment guide

---

## ✅ Checklist: Sebelum Production

- [ ] Database migration applied (`pdf_url` column exists)
- [ ] All PDFs uploaded to COS folder `/pdf/`
- [ ] Books updated with `pdf_url` in database
- [ ] PDF reader tested on desktop & mobile
- [ ] CORS configured for COS bucket
- [ ] File size optimized (< 10MB per PDF)
- [ ] Legal rights verified for all PDFs
- [ ] Analytics tracking implemented
- [ ] Error handling tested (missing PDF, CORS issues)
- [ ] Documentation updated

---

## 🎉 Congratulations!

Aplikasi Storify Insights sekarang memiliki fitur lengkap:
- 🎧 **Listen**: Audio summary (5-30 min)
- 📖 **Read**: Full book PDF (complete)

**Next Steps:**
- Add more PDFs to library
- Implement reading progress tracking
- Add highlights & notes feature
- Enable PDF bookmarks

Happy reading! 📚✨
