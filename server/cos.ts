/**
 * Tencent Cloud Object Storage (COS) Service
 * Handles file uploads to COS bucket for audio files
 */

import COS from 'cos-nodejs-sdk-v5';
import fs from 'fs';
import path from 'path';
import { COVER_EXTENSIONS } from './cover-extensions';

// Initialize COS client
export function createCOSClient(): COS {
  const secretId = process.env.COS_SECRET_ID;
  const secretKey = process.env.COS_SECRET_KEY;

  if (!secretId || !secretKey) {
    throw new Error('COS credentials not configured. Please set COS_SECRET_ID and COS_SECRET_KEY in .env');
  }

  return new COS({
    SecretId: secretId,
    SecretKey: secretKey,
  });
}

export function getCOSConfig() {
  const region = process.env.COS_REGION || 'ap-jakarta';
  const bucket = process.env.COS_BUCKET || 'pewacaold-1379748683';
  
  if (!bucket) {
    throw new Error('COS_BUCKET not configured in .env');
  }

  return { region, bucket };
}

/**
 * Get public URL for a file in COS
 */
export function getCOSUrl(key: string): string {
  const { region, bucket } = getCOSConfig();
  return `https://${bucket}.cos.${region}.myqcloud.com/${key}`;
}

export interface UploadOptions {
  filePath: string;        // Local file path
  key: string;             // Remote COS key (path in bucket)
  contentType?: string;    // MIME type
  onProgress?: (percent: number) => void;
}

/**
 * Upload a file to COS
 */
export async function uploadFileToCOS(options: UploadOptions): Promise<string> {
  const { filePath, key, contentType, onProgress } = options;
  const { region, bucket } = getCOSConfig();
  const cos = createCOSClient();

  // Verify file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
        Body: fs.createReadStream(filePath),
        ContentType: contentType || 'application/octet-stream',
        onProgress: (progressData) => {
          if (onProgress) {
            const percent = Math.round((progressData.loaded / progressData.total) * 100);
            onProgress(percent);
          }
        },
      },
      (err, data) => {
        if (err) {
          reject(new Error(`Failed to upload ${key}: ${err.message}`));
        } else {
          const url = getCOSUrl(key);
          resolve(url);
        }
      }
    );
  });
}

/**
 * Upload audio file from local folder to COS
 * Automatically sets content-type for audio files
 */
export async function uploadAudioToCOS(
  localPath: string,
  remoteKey?: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const filename = path.basename(localPath);
  const key = remoteKey || `audio/${filename}`;
  
  // Determine content type
  const ext = path.extname(filename).toLowerCase();
  const contentTypeMap: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
  };
  const contentType = contentTypeMap[ext] || 'audio/mpeg';

  console.log(`[COS] Uploading ${filename} → ${key}`);
  
  const url = await uploadFileToCOS({
    filePath: localPath,
    key,
    contentType,
    onProgress,
  });

  console.log(`[COS] ✅ Uploaded: ${url}`);
  return url;
}

/**
 * Check if a file exists in COS
 */
export async function fileExistsInCOS(key: string): Promise<boolean> {
  const { region, bucket } = getCOSConfig();
  const cos = createCOSClient();

  return new Promise((resolve) => {
    cos.headObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
      },
      (err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      }
    );
  });
}

/**
 * Delete a file from COS
 */
export async function deleteFileFromCOS(key: string): Promise<void> {
  const { region, bucket } = getCOSConfig();
  const cos = createCOSClient();

  return new Promise((resolve, reject) => {
    cos.deleteObject(
      {
        Bucket: bucket,
        Region: region,
        Key: key,
      },
      (err) => {
        if (err) {
          reject(new Error(`Failed to delete ${key}: ${err.message}`));
        } else {
          console.log(`[COS] 🗑️ Deleted: ${key}`);
          resolve();
        }
      }
    );
  });
}

/**
 * List all files in a COS directory
 */
export async function listCOSFiles(prefix: string = ''): Promise<string[]> {
  const { region, bucket } = getCOSConfig();
  const cos = createCOSClient();

  return new Promise((resolve, reject) => {
    cos.getBucket(
      {
        Bucket: bucket,
        Region: region,
        Prefix: prefix,
      },
      (err, data) => {
        if (err) {
          reject(new Error(`Failed to list files: ${err.message}`));
        } else {
          const files = (data.Contents || []).map((item) => item.Key || '');
          resolve(files);
        }
      }
    );
  });
}

/**
 * Get cover image URL from pewacaold bucket
 * Tries different image extensions: jpg, jpeg, png, webp
 */
export async function getCoverImageUrl(bookId: number): Promise<string | null> {
  const bucket = 'pewacaold-1379748683';
  const region = 'ap-jakarta';
  const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'];
  
  // Try each extension
  for (const ext of imageExtensions) {
    const key = `image/${bookId}.${ext}`;
    const url = `https://${bucket}.cos.${region}.myqcloud.com/${key}`;
    
    // Check if file exists by making HEAD request
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        return url;
      }
    } catch (error) {
      // Continue to next extension
      continue;
    }
  }
  
  return null; // No cover image found
}

/**
 * Generate cover URL for a book with correct extension
 * Uses mapping from cover-extensions.ts or returns placeholder if not found
 */
export function generateCoverUrl(bookId: number): string {
  // Check if this book has a cover image
  if (!COVER_EXTENSIONS[bookId]) {
    // Return local placeholder image for books without covers
    return '/placeholder-book.svg';
  }
  
  const bucket = 'pewacaold-1379748683';
  const region = 'ap-jakarta';
  const extension = COVER_EXTENSIONS[bookId];
  
  return `https://${bucket}.cos.${region}.myqcloud.com/image/${bookId}.${extension}`;
}
