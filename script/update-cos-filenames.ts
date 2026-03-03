/**
 * Update Script: Populate cosFilename for existing books
 * 
 * This script:
 * 1. Reads all books with COS audio URLs
 * 2. Extracts filename from audioUrl
 * 3. Updates cosFilename field
 * 
 * Usage: npx tsx script/update-cos-filenames.ts
 */

import 'dotenv/config';
import { db } from '../server/db';
import { books } from '../shared/schema';
import { like, isNull, eq } from 'drizzle-orm';

async function updateCosFilenames() {
  console.log('🔄 Updating cosFilename for existing books...\n');
  
  // Get all books with COS audio but no cosFilename
  const booksToUpdate = await db
    .select()
    .from(books)
    .where(like(books.audioUrl, '%pewacaold-1379748683.cos.ap-jakarta.myqcloud.com%'));
  
  console.log(`📊 Found ${booksToUpdate.length} books with COS audio\n`);
  
  let updated = 0;
  let failed = 0;
  
  for (const book of booksToUpdate) {
    try {
      // Extract filename from URL
      const urlMatch = book.audioUrl.match(/\/audio\/(.+)$/);
      if (urlMatch) {
        const filename = decodeURIComponent(urlMatch[1]);
        
        // Update book
        await db
          .update(books)
          .set({ cosFilename: filename })
          .where(eq(books.id, book.id));
        
        updated++;
        const titleDisplay = (book as any).titleFix || (book as any).title || '';
        console.log(`✓ [${book.id}] ${titleDisplay.substring(0, 50)}... → ${filename.substring(0, 40)}...`);
      } else {
        console.log(`⚠️  [${book.id}] Could not extract filename from: ${book.audioUrl}`);
        failed++;
      }
    } catch (error) {
      console.error(`✗ [${book.id}] Error:`, error instanceof Error ? error.message : String(error));
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 UPDATE SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total books: ${booksToUpdate.length}`);
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(70));
  
  if (updated > 0) {
    console.log('\n✨ COS filenames successfully populated!');
    console.log('   Run verify-audio-matching.ts to see the results.');
  }
}

updateCosFilenames()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
