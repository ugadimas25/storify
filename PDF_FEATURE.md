# 📚 Fitur Baca Buku PDF - Storify Insights

## Overview
Storify Insights sekarang tidak hanya menyediakan ringkasan audio, tapi juga **file PDF lengkap** untuk dibaca langsung di aplikasi. Pengalaman membaca yang seamless dengan PDF reader yang responsive dan user-friendly.

---

## 🎯 Fitur

### 1. **PDF Reader Terintegrasi**
- Tampilan PDF dalam aplikasi (tidak perlu download)
- Zoom in/out untuk kenyamanan membaca
- Fullscreen mode untuk fokus maksimal
- Download PDF untuk baca offline
- Responsive di mobile & desktop

### 2. **Badge Indikator PDF**
- Book card menampilkan badge "PDF" jika buku memiliki versi lengkap
- Mudah mengidentifikasi buku mana yang punya PDF

### 3. **Dual Mode Reading**
- **Listen Mode**: Dengarkan ringkasan audio (audio summary)
- **Read Mode**: Baca buku lengkap dalam format PDF

---

## 📁 Struktur File di COS

File PDF disimpan di Cloud Object Storage (Tencent COS) dengan struktur:

```
pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/
├── audio/              # Folder untuk file audio ringkasan
│   ├── book1.wav
│   └── book2.mp3
├── covers/             # Folder untuk cover buku
│   ├── book1.jpg
│   └── book2.png
└── pdf/                # Folder untuk PDF buku lengkap
    ├── Book Title - Author.pdf
    ├── Another Book.pdf
    └── ...
```

**⚠️ Penting:**
- Nama file PDF harus konsisten dengan title buku
- Format yang direkomendasikan: `Title - Author.pdf` atau `Title.pdf`
- Gunakan underscore atau dash sebagai pemisah kata

---

## 🚀 Cara Upload PDF ke COS

### Manual Upload via Console

1. Login ke [Tencent Cloud Console](https://console.cloud.tencent.com/cos5)
2. Pilih bucket: `pewacaold-1379748683`
3. Masuk ke folder `pdf/` (atau buat jika belum ada)
4. Upload file PDF dengan nama yang sesuai dengan title buku

### Via Script (Rekomendasi untuk Bulk Upload)

```bash
# Install dependencies jika belum
npm install cos-nodejs-sdk-v5

# Upload single PDF
node script/upload-pdf-to-cos.ts "path/to/book.pdf"

# Upload semua PDF dari folder
node script/upload-pdf-to-cos.ts "books_pdf_folder" --bulk
```

---

## 🗄️ Database Schema

Field baru di table `books_list`:

```sql
ALTER TABLE books_list ADD COLUMN pdf_url TEXT;
```

Untuk menambahkan PDF URL ke buku yang sudah ada:

```sql
UPDATE books_list 
SET pdf_url = 'https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/pdf/BookTitle.pdf'
WHERE id = 123;
```

---

## 💻 Implementasi di Frontend

### BookDetail Page
```tsx
// Tombol "Listen to Summary" - untuk audio
<Button onClick={() => playBook(book)}>
  <Headphones /> Listen to Summary
</Button>

// Tombol "Read Full Book" - untuk PDF (hanya muncul jika pdfUrl ada)
{book.pdfUrl && (
  <Button onClick={() => setShowPDFReader(true)}>
    <BookOpen /> Read Full Book
  </Button>
)}
```

### BookCard Component
```tsx
// Badge PDF muncul di pojok kiri atas cover
{book.pdfUrl && (
  <div className="badge">
    <BookOpen /> PDF
  </div>
)}
```

---

## 🔄 Update Data via Script Import

Jika menggunakan script `import-books.ts`, pastikan CSV memiliki kolom `pdf_filename`:

```csv
title,author,category,pdf_filename
"Atomic Habits","James Clear","Self-Improvement","Atomic_Habits-James_Clear.pdf"
```

Script akan otomatis:
1. Match PDF filename dengan file di folder `pdf/`
2. Generate `pdfUrl` menggunakan `getCOSUrl('pdf/{filename}')`
3. Insert/update ke database

---

## 🎨 UX Design Decisions

### Mengapa Dual Mode?
- **Audio Summary**: Cepat, cocok untuk mobile/commuting (5-30 menit)
- **Full PDF**: Deep dive, cocok untuk desktop/serious reading (beberapa jam)

### Mengapa Inline PDF Reader?
- Mengurangi friction (tidak perlu download dulu)
- Seamless experience dalam satu app
- Track reading progress (future feature)
- Social features: highlight, notes (future feature)

### Mobile Experience
- PDF viewer optimized untuk mobile scroll
- Download option jika ingin baca di PDF reader favorit
- Zoom gesture support

---

## 📊 Analytics & Tracking

Track user behavior:
```typescript
// Log when user opens PDF
logActivity(userId, 'open_pdf', 'book', bookId, { title, format: 'pdf' });

// Log reading duration
logActivity(userId, 'read_pdf', 'book', bookId, { duration: seconds });
```

---

## 🐛 Troubleshooting

### PDF tidak muncul
1. Cek apakah field `pdf_url` di database terisi
2. Cek apakah URL valid dan file accessible
3. Cek CORS policy di COS bucket (sudah dikonfigurasi)

### PDF tidak bisa dibuka di browser tertentu
- Beberapa browser tidak support iframe untuk PDF
- User akan diarahkan untuk download PDF

### PDF loading lambat
- Compress PDF menggunakan tool seperti Adobe Acrobat atau online compressor
- Target size: < 10MB per file
- Gunakan PDF optimization untuk web

---

## 🔮 Future Enhancements

1. **PDF Search**: Cari keyword dalam PDF
2. **Bookmarks**: Save halaman terakhir dibaca
3. **Highlights & Notes**: Tandai dan catat bagian penting
4. **Reading Progress**: Track % completed
5. **Social Reading**: Share highlights dengan teman
6. **Text-to-Speech**: Baca PDF dengan AI voice
7. **Translation**: Terjemahkan PDF ke bahasa lain

---

## 📝 Contoh Flow User

1. User browse buku di **Explore** page
2. Melihat badge "PDF" di book card → tertarik
3. Klik buku → masuk **BookDetail** page
4. Pilih:
   - **Listen to Summary** → mainkan audio (cepat)
   - **Read Full Book** → buka PDF reader (lengkap)
5. Di PDF reader:
   - Scroll untuk baca
   - Zoom in/out
   - Fullscreen untuk fokus
   - Download jika mau baca offline

---

## 🎉 Kesimpulan

Dengan fitur PDF ini, Storify Insights menjadi **platform lengkap** untuk belajar:
- 🎧 **Quick Learn**: Audio summary 5-30 menit
- 📖 **Deep Learn**: Full book PDF
- 📱 **Anywhere**: Mobile & Desktop
- ☁️ **Cloud-based**: Tidak makan storage device

**Value Proposition**: "Dengarkan ringkasannya, baca bukunya lengkap. Semua di satu tempat."
