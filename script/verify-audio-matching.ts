/**
 * Verify Script: Check book-audio matching in database
 * 
 * This script checks:
 * 1. Books with COS audio vs dummy audio
 * 2. COS filename matching validation
 * 3. Missing or mismatched audio files
 * 
 * Usage: npx tsx script/verify-audio-matching.ts
 */

import 'dotenv/config';
import { db } from '../server/db';
import { books } from '../shared/schema';
import { isNull, isNotNull, like, notLike } from 'drizzle-orm';

interface BookAudioReport {
  totalBooks: number;
  withCosAudio: number;
  withDummyAudio: number;
  withCosFilename: number;
  withoutCosFilename: number;
  mismatches: Array<{
    id: number;
    title: string;
    audioUrl: string;
    cosFilename: string | null;
    expectedFilename: string;
  }>;
}

async function verifyAudioMatching(): Promise<BookAudioReport> {
  console.log('🔍 Verifying book-audio matching...\n');
  
  // Get all books
  const allBooks = await db.select().from(books);
  
  const report: BookAudioReport = {
    totalBooks: allBooks.length,
    withCosAudio: 0,
    withDummyAudio: 0,
    withCosFilename: 0,
    withoutCosFilename: 0,
    mismatches: [],
  };
  
  for (const book of allBooks) {
    // Check if audio is from COS or dummy
    const isCosAudio = book.audioUrl.includes('pewacaold-1379748683.cos.ap-jakarta.myqcloud.com');
    const isDummyAudio = book.audioUrl.includes('soundhelix.com');
    
    if (isCosAudio) {
      report.withCosAudio++;
      
      // Extract filename from URL
      const urlMatch = book.audioUrl.match(/\/audio\/(.+)$/);
      const extractedFilename = urlMatch ? decodeURIComponent(urlMatch[1]) : '';
      
      if (book.cosFilename) {
        report.withCosFilename++;
        
        // Check if cosFilename matches URL
        if (book.cosFilename !== extractedFilename) {
          report.mismatches.push({
            id: book.id,
            title: book.title,
            audioUrl: book.audioUrl,
            cosFilename: book.cosFilename,
            expectedFilename: extractedFilename,
          });
        }
      } else {
        report.withoutCosFilename++;
      }
    } else if (isDummyAudio) {
      report.withDummyAudio++;
    }
  }
  
  return report;
}

async function printReport() {
  const report = await verifyAudioMatching();
  
  console.log('='.repeat(70));
  console.log('📊 BOOK-AUDIO MATCHING REPORT');
  console.log('='.repeat(70));
  console.log();
  
  console.log('📚 Total Books:', report.totalBooks);
  console.log('✅ With COS Audio:', report.withCosAudio);
  console.log('❌ With Dummy Audio:', report.withDummyAudio);
  console.log();
  
  console.log('🏷️  COS Filename Field:');
  console.log('  ✓ Populated:', report.withCosFilename);
  console.log('  ✗ Empty:', report.withoutCosFilename);
  console.log();
  
  if (report.mismatches.length > 0) {
    console.log('⚠️  MISMATCHES FOUND:');
    console.log('='.repeat(70));
    for (const mismatch of report.mismatches) {
      console.log(`\nBook ID: ${mismatch.id}`);
      console.log(`Title: ${mismatch.title}`);
      console.log(`Stored cosFilename: ${mismatch.cosFilename}`);
      console.log(`Expected from URL: ${mismatch.expectedFilename}`);
    }
    console.log();
  } else {
    console.log('✅ All COS audio files match perfectly!');
  }
  
  console.log('='.repeat(70));
  
  // Show sample books with COS audio
  const sampleCosBooks = await db
    .select({
      id: books.id,
      title: books.title,
      cosFilename: books.cosFilename,
    })
    .from(books)
    .where(notLike(books.audioUrl, '%soundhelix%'))
    .limit(5);
  
  if (sampleCosBooks.length > 0) {
    console.log('\n📋 Sample Books with COS Audio:');
    console.log('-'.repeat(70));
    for (const book of sampleCosBooks) {
      console.log(`[${book.id}] ${book.title}`);
      console.log(`    COS File: ${book.cosFilename || '(not set)'}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Summary
  if (report.withCosAudio > 0) {
    const matchRate = ((report.withCosFilename / report.withCosAudio) * 100).toFixed(1);
    console.log(`\n✨ Match Rate: ${matchRate}% (${report.withCosFilename}/${report.withCosAudio} COS books have filename)`);
  }
  
  if (report.withDummyAudio > 0) {
    console.log(`\n⚠️  ${report.withDummyAudio} books still using dummy audio (will be filtered out from display)`);
  }
}

printReport()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
