/**
 * Fix audio-book matching: strict 1:1 matching only
 * 
 * Problem: fuzzy matching assigned wrong audio files to books
 * Solution: Extract real title from COS filename, match only if book title 
 * clearly corresponds to that audio file
 */

import { db } from '../server/db';
import { books } from '../shared/schema';
import { eq, sql, like, or, ilike } from 'drizzle-orm';
import * as fs from 'fs';

// Load the 22 COS audio files
interface AudioResult {
  filename: string;
  cosUrl: string;
}

// Manually define the title keywords each audio file should match to
// Format: { cosFilename, cosUrl, titleKeywords (used for ILIKE matching on book title) }
const AUDIO_BOOK_MAP: {
  filename: string;
  cosUrl: string;
  // Each entry: if ANY of these patterns match the book title (case-insensitive), assign this audio
  titlePatterns: string[];
}[] = [
  {
    filename: "108_ Menikah Sehat dan Islami_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/108_%20Menikah%20Sehat%20dan%20Islami_essential_info.wav",
    titlePatterns: ["%Menikah Sehat dan Islami%"]
  },
  {
    filename: "1248_ The Art of Public Speaking The Original Tool_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/1248_%20The%20Art%20of%20Public%20Speaking%20The%20Original%20Tool_essential_info.wav",
    titlePatterns: ["%Art of Public Speaking%"]
  },
  {
    filename: "128-Article Text-1165-1-10-20201215_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/128-Article%20Text-1165-1-10-20201215_essential_info.wav",
    titlePatterns: ["%128-Article Text%"]
  },
  {
    filename: "16-05-2021-070111The-Richest-Man-in-Babylon_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/16-05-2021-070111The-Richest-Man-in-Babylon_essential_info.wav",
    titlePatterns: ["%Richest%Man%Babylon%", "%Richest-Man-in-Babylon%"]
  },
  {
    filename: "1762_ Master Your Emotions A b_indonesia_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/1762_%20Master%20Your%20Emotions%20A%20b_indonesia_essential_info.wav",
    titlePatterns: ["%Master Your Emotions%"]
  },
  {
    filename: "1_453_ Pernikahan wanita hamil akibat zina_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/1_453_%20Pernikahan%20wanita%20hamil%20akibat%20zina_essential_info.wav",
    titlePatterns: ["%Pernikahan%wanita hamil%zina%"]
  },
  {
    filename: "243__Baca_Buku_Ini_Saat_Engkau_Lelah_-_Munita_Yeni_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/243__Baca_Buku_Ini_Saat_Engkau_Lelah_-_Munita_Yeni_essential_info.wav",
    titlePatterns: ["%Baca Buku Ini Saat Engkau Lelah%"]
  },
  {
    filename: "25-Permasalahan-Seputar-Pernikahan 2_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/25-Permasalahan-Seputar-Pernikahan%202_essential_info.wav",
    titlePatterns: ["%Permasalahan%Seputar%Pernikahan%"]
  },
  {
    filename: "25-Permasalahan-Seputar-Pernikahan_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/25-Permasalahan-Seputar-Pernikahan_essential_info.wav",
    titlePatterns: ["%Permasalahan%Seputar%Pernikahan%"]
  },
  {
    filename: "328_ Ibadah-Ibadah Saat Haid_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/328_%20Ibadah-Ibadah%20Saat%20Haid_essential_info.wav",
    titlePatterns: ["%Ibadah%Saat Haid%", "%Ibadah-Ibadah%Haid%"]
  },
  {
    filename: "8e5dd-aproval-parenting-anak-usia-dini_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/8e5dd-aproval-parenting-anak-usia-dini_essential_info.wav",
    titlePatterns: ["%parenting-anak-usia-dini%", "%parenting%anak%usia%dini%"]
  },
  {
    filename: "99 Untuk Tuhanku - Emha Ainun Nadjib_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/99%20Untuk%20Tuhanku%20-%20Emha%20Ainun%20Nadjib_essential_info.wav",
    titlePatterns: ["%99 Untuk Tuhanku%"]
  },
  {
    filename: "A The Essence of Thick Face_ Black Heart _ PDFDriv_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/A%20The%20Essence%20of%20Thick%20Face_%20Black%20Heart%20_%20PDFDriv_essential_info.wav",
    titlePatterns: ["%Thick Face%Black Heart%"]
  },
  {
    filename: "Aboebakar Atjeh - Aliran Syi_ah di Nusantara_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/Aboebakar%20Atjeh%20-%20Aliran%20Syi_ah%20di%20Nusantara_essential_info.wav",
    titlePatterns: ["%Aliran Syi%ah di Nusantara%", "%Aboebakar Atjeh%"]
  },
  {
    filename: "Algoritma Pemrograman Pende_ _Z-Library__essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/Algoritma%20Pemrograman%20Pende_%20_Z-Library__essential_info.wav",
    titlePatterns: ["%Algoritma Pemrograman%"]
  },
  {
    filename: "Ambillah Aqidahmu - Syaikh Muhammad Jamil Zainu_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/Ambillah%20Aqidahmu%20-%20Syaikh%20Muhammad%20Jamil%20Zainu_essential_info.wav",
    titlePatterns: ["%Ambillah Aqidahmu%"]
  },
  {
    filename: "An Honest Thief - Fyodor Dostoyevsky - PDF_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/An%20Honest%20Thief%20-%20Fyodor%20Dostoyevsky%20-%20PDF_essential_info.wav",
    titlePatterns: ["%Honest Thief%"]
  },
  {
    filename: "Anak-Anak Revolusi-buku1_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/Anak-Anak%20Revolusi-buku1_essential_info.wav",
    titlePatterns: ["%Anak-Anak Revolusi%", "%Anak Anak Revolusi%"]
  },
  {
    filename: "ANARKHISME DAN REVOLUSI SOSIAL - ALEXANDER BERKMAN_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/ANARKHISME%20DAN%20REVOLUSI%20SOSIAL%20-%20ALEXANDER%20BERKMAN_essential_info.wav",
    titlePatterns: ["%Anarkhisme%Revolusi Sosial%"]
  },
  {
    filename: "Andrea Hirata - Sang Pemimpi _ PDFDrive __essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/Andrea%20Hirata%20-%20Sang%20Pemimpi%20_%20PDFDrive%20__essential_info.wav",
    titlePatterns: ["%Sang Pemimpi%", "Andrea Hirata"]  // exact match only, not "Ayah (Andrea Hirata)"
  },
  {
    filename: "AVERE PROJECT _Naskah Fiks__essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/AVERE%20PROJECT%20_Naskah%20Fiks__essential_info.wav",
    titlePatterns: ["%AVERE%PROJECT%", "%Avere%"]
  },
  {
    filename: "Awalil_Rizky__Nasyith_Majidi_Utang_Pemerintah_Menc_essential_info.wav",
    cosUrl: "https://pewacaold-1379748683.cos.ap-jakarta.myqcloud.com/audio/Awalil_Rizky__Nasyith_Majidi_Utang_Pemerintah_Menc_essential_info.wav",
    titlePatterns: ["%Utang Pemerintah%"]
  },
];

async function fixAudioMatching() {
  console.log("=== Fix Audio-Book Matching ===\n");
  
  // Step 1: Get actual COS URLs from upload report (to use proper encoded URLs)
  const reportPath = 'audio-upload-report.json';
  let uploadedFiles: AudioResult[] = [];
  
  if (fs.existsSync(reportPath)) {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
    uploadedFiles = report.results
      .filter((r: any) => r.status === 'success')
      .map((r: any) => ({ filename: r.filename, cosUrl: r.cosUrl }));
    console.log(`Loaded ${uploadedFiles.length} COS audio files from report\n`);
  }
  
  // Build a lookup: filename → cosUrl from the actual report
  const reportUrlMap = new Map<string, string>();
  for (const f of uploadedFiles) {
    reportUrlMap.set(f.filename, f.cosUrl);
  }
  
  // Step 2: Reset ALL books to dummy audio
  console.log("Step 1: Resetting ALL books to dummy audio...");
  const allBooks = await db.select({ id: books.id, title: books.title }).from(books);
  console.log(`  Total books in database: ${allBooks.length}`);
  
  let resetCount = 0;
  for (const book of allBooks) {
    const randomIndex = Math.floor(Math.random() * 16) + 1;
    const dummyUrl = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${randomIndex}.mp3`;
    await db.update(books)
      .set({ audioUrl: dummyUrl, cosFilename: null })
      .where(eq(books.id, book.id));
    resetCount++;
  }
  console.log(`  ✓ Reset ${resetCount} books to dummy audio\n`);
  
  // Step 3: For each audio file, find matching books and assign
  console.log("Step 2: Assigning audio to matching books (strict matching)...\n");
  
  let totalMatched = 0;
  let totalUnmatched = 0;
  
  for (const audioEntry of AUDIO_BOOK_MAP) {
    if (audioEntry.titlePatterns.length === 0) {
      console.log(`  ⏭  "${audioEntry.filename}" - No title pattern defined, skipping`);
      totalUnmatched++;
      continue;
    }
    
    // Use the actual COS URL from the upload report if available
    const cosUrl = reportUrlMap.get(audioEntry.filename) || audioEntry.cosUrl;
    
    // Search for matching books using ILIKE patterns
    let matchedBooks: { id: number; title: string }[] = [];
    
    for (const pattern of audioEntry.titlePatterns) {
      const found = await db.select({ id: books.id, title: books.title })
        .from(books)
        .where(ilike(books.title, pattern));
      
      // Add to matched (deduplicate by id)
      for (const b of found) {
        if (!matchedBooks.find(m => m.id === b.id)) {
          matchedBooks.push(b);
        }
      }
    }
    
    if (matchedBooks.length === 0) {
      console.log(`  ✗ "${audioEntry.filename}"`);
      console.log(`    No matching books found for patterns: ${audioEntry.titlePatterns.join(', ')}`);
      totalUnmatched++;
    } else {
      // Update all matching books with this audio
      for (const match of matchedBooks) {
        await db.update(books)
          .set({ 
            audioUrl: cosUrl,
            cosFilename: audioEntry.filename
          })
          .where(eq(books.id, match.id));
      }
      
      console.log(`  ✓ "${audioEntry.filename}"`);
      console.log(`    → Matched ${matchedBooks.length} book(s): ${matchedBooks.map(b => `"${b.title}"`).join(', ')}`);
      totalMatched += matchedBooks.length;
    }
  }
  
  // Step 4: Summary
  console.log("\n=== Summary ===");
  console.log(`Total COS audio files: ${AUDIO_BOOK_MAP.length}`);
  console.log(`Audio files with matching books: ${AUDIO_BOOK_MAP.length - totalUnmatched}`);
  console.log(`Audio files without matches: ${totalUnmatched}`);
  console.log(`Total books with COS audio: ${totalMatched}`);
  console.log(`Total books with dummy audio: ${allBooks.length - totalMatched}`);
  
  // Verify the result
  console.log("\n=== Verification ===");
  const cosBooks = await db.select({ id: books.id, title: books.title, cosFilename: books.cosFilename })
    .from(books)
    .where(sql`${books.cosFilename} IS NOT NULL`);
  
  console.log(`\nBooks with COS audio (${cosBooks.length}):`);
  for (const b of cosBooks) {
    console.log(`  [${b.id}] "${b.title}" → ${b.cosFilename}`);
  }
  
  process.exit(0);
}

fixAudioMatching().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
