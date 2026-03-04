/**
 * Upload Script: Upload PDF files to Tencent COS
 * 
 * This script:
 * 1. Scans local PDF directory
 * 2. Uploads all PDF files to COS bucket under /pdf/ directory
 * 3. Generates a mapping report of filename → COS URL
 * 
 * Usage:
 *   npm run tsx script/upload-pdf-to-cos.ts
 *   npm run tsx script/upload-pdf-to-cos.ts -- --dir /path/to/pdfs
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { uploadFileToCOS, getCOSUrl, fileExistsInCOS } from '../server/cos';

// Default source directory (can be overridden via CLI arg)
const DEFAULT_SOURCE_DIR = 'D:\\b_outside\\a_intesa_global_technology\\Storify\\pdf_books';

// Output report file
const REPORT_FILE = path.join(process.cwd(), 'pdf-upload-report.json');

interface UploadResult {
  filename: string;
  localPath: string;
  cosKey: string;
  cosUrl: string;
  fileSize: number;
  status: 'success' | 'skipped' | 'failed';
  error?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function uploadPDFDirectory(sourceDir: string) {
  console.log('📚 Starting PDF files upload to Tencent COS...\n');
  console.log(`📂 Source: ${sourceDir}`);
  console.log(`☁️  Destination: COS Bucket (pdf/)\n`);

  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Error: Source directory not found: ${sourceDir}`);
    console.log(`\n💡 Tip: Create the directory or specify custom path:`);
    console.log(`   npm run tsx script/upload-pdf-to-cos.ts -- --dir /your/pdf/folder\n`);
    process.exit(1);
  }

  // Get all PDF files
  const allFiles = fs.readdirSync(sourceDir);
  const pdfFiles = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ext === '.pdf';
  });

  console.log(`📊 Found ${pdfFiles.length} PDF files\n`);

  if (pdfFiles.length === 0) {
    console.log('⚠️  No PDF files found. Exiting.');
    return;
  }

  const results: UploadResult[] = [];
  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  // Upload each file
  for (let i = 0; i < pdfFiles.length; i++) {
    const filename = pdfFiles[i];
    const localPath = path.join(sourceDir, filename);
    const fileSize = fs.statSync(localPath).size;
    const cosKey = `pdf/${filename}`;

    console.log(`[${i + 1}/${pdfFiles.length}] ${filename} (${formatFileSize(fileSize)})`);

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

      // Upload file with progress
      const cosUrl = await uploadFileToCOS({
        filePath: localPath,
        key: cosKey,
        contentType: 'application/pdf',
        onProgress: (percent) => {
          process.stdout.write(`\r   📤 Uploading... ${percent}%`);
        }
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

    } catch (error: any) {
      console.log(`\r   ❌ Failed: ${error.message}\n`);
      failedCount++;

      results.push({
        filename,
        localPath,
        cosKey,
        cosUrl: '',
        fileSize,
        status: 'failed',
        error: error.message,
      });
    }
  }

  // Save report
  fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2), 'utf-8');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 Upload Summary');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`❌ Failed:  ${failedCount}`);
  console.log(`📊 Total:   ${pdfFiles.length}`);
  console.log('='.repeat(60));
  console.log(`\n📄 Full report saved: ${REPORT_FILE}\n`);

  // Show failed uploads if any
  if (failedCount > 0) {
    console.log('❌ Failed uploads:');
    results
      .filter(r => r.status === 'failed')
      .forEach(r => {
        console.log(`   - ${r.filename}: ${r.error}`);
      });
    console.log();
  }

  // Generate URL mapping for easy reference
  console.log('📚 PDF URL Mapping (for database updates):\n');
  results
    .filter(r => r.status === 'success' || r.status === 'skipped')
    .slice(0, 10) // Show first 10
    .forEach(r => {
      console.log(`"${r.filename}" → ${r.cosUrl}`);
    });
  
  if (results.length > 10) {
    console.log(`\n... and ${results.length - 10} more (see report file)\n`);
  }
}

// Parse CLI arguments
function parseArgs(): string {
  const args = process.argv.slice(2);
  const dirIndex = args.indexOf('--dir');
  
  if (dirIndex !== -1 && args[dirIndex + 1]) {
    return args[dirIndex + 1];
  }
  
  return DEFAULT_SOURCE_DIR;
}

// Main execution
const sourceDir = parseArgs();
uploadPDFDirectory(sourceDir)
  .then(() => {
    console.log('✨ Upload complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
