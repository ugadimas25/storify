/**
 * Upload Script: Migrate existing audio files to Tencent COS
 * 
 * This script:
 * 1. Scans D:\b_outside\a_intesa_global_technology\Storify\audio_output
 * 2. Uploads all audio files to COS bucket under /audio/ directory
 * 3. Generates a mapping report of filename → COS URL
 * 
 * Usage:
 *   npm run tsx script/upload-audio-to-cos.ts
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { uploadAudioToCOS, getCOSUrl, fileExistsInCOS } from '../server/cos';

// Source directory (local audio files)
const SOURCE_DIR = 'D:\\b_outside\\a_intesa_global_technology\\Storify\\audio_output';

// Output report file
const REPORT_FILE = path.join(process.cwd(), 'audio-upload-report.json');

interface UploadResult {
  filename: string;
  localPath: string;
  cosKey: string;
  cosUrl: string;
  fileSize: number;
  status: 'success' | 'skipped' | 'failed';
  error?: string;
}

async function uploadAudioDirectory() {
  console.log('🚀 Starting audio files migration to Tencent COS...\n');
  console.log(`📂 Source: ${SOURCE_DIR}`);
  console.log(`☁️  Destination: COS Bucket (audio/)\n`);

  // Check if source directory exists
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Error: Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  // Get all audio files
  const allFiles = fs.readdirSync(SOURCE_DIR);
  const audioFiles = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.mp3', '.wav', '.m4a', '.ogg', '.flac'].includes(ext);
  });

  console.log(`📊 Found ${audioFiles.length} audio files\n`);

  if (audioFiles.length === 0) {
    console.log('⚠️  No audio files found. Exiting.');
    return;
  }

  const results: UploadResult[] = [];
  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  // Upload each file
  for (let i = 0; i < audioFiles.length; i++) {
    const filename = audioFiles[i];
    const localPath = path.join(SOURCE_DIR, filename);
    const fileSize = fs.statSync(localPath).size;
    const cosKey = `audio/${filename}`;

    console.log(`[${i + 1}/${audioFiles.length}] ${filename} (${formatFileSize(fileSize)})`);

    try {
      // Check if file already exists in COS
      const exists = await fileExistsInCOS(cosKey);
      
      if (exists) {
        console.log(`   ⏭️  Skipped (already exists)\n`);
        skippedCount++;
        
        results.push({
          filename,
          localPath,
          cosKey,
          cosUrl: getCOSUrl(cosKey),
          fileSize,
          status: 'skipped',
        });
        continue;
      }

      // Upload file
      const cosUrl = await uploadAudioToCOS(localPath, cosKey, (percent) => {
        process.stdout.write(`\r   📤 Uploading... ${percent}%`);
      });

      console.log(`\r   ✅ Success: ${cosUrl}\n`);
      successCount++;

      results.push({
        filename,
        localPath,
        cosKey,
        cosUrl,
        fileSize,
        status: 'success',
      });

    } catch (error) {
      console.log(`\r   ❌ Failed: ${error instanceof Error ? error.message : String(error)}\n`);
      failedCount++;

      results.push({
        filename,
        localPath,
        cosKey,
        cosUrl: getCOSUrl(cosKey),
        fileSize,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Save report
  const report = {
    date: new Date().toISOString(),
    sourceDirectory: SOURCE_DIR,
    totalFiles: audioFiles.length,
    success: successCount,
    skipped: skippedCount,
    failed: failedCount,
    results,
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files:    ${audioFiles.length}`);
  console.log(`✅ Uploaded:    ${successCount}`);
  console.log(`⏭️  Skipped:     ${skippedCount}`);
  console.log(`❌ Failed:      ${failedCount}`);
  console.log('='.repeat(60));
  console.log(`\n📄 Report saved to: ${REPORT_FILE}`);

  if (failedCount > 0) {
    console.log('\n⚠️  Some files failed to upload. Check the report for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 All files uploaded successfully!');
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Run the upload
uploadAudioDirectory().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
