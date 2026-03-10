/**
 * Regenerate cover-extensions.ts by listing all images in COS bucket
 * Run: npx dotenv -e .env tsx script/regenerate-cover-extensions.ts
 */
import COS from 'cos-nodejs-sdk-v5';
import fs from 'fs';
import path from 'path';

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID!,
  SecretKey: process.env.COS_SECRET_KEY!,
});

const BUCKET = process.env.COS_BUCKET || 'pewacaold-1379748683';
const REGION = process.env.COS_REGION || 'ap-jakarta';

async function listAllObjects(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let marker = '';

  while (true) {
    const data: any = await new Promise((resolve, reject) => {
      cos.getBucket({
        Bucket: BUCKET,
        Region: REGION,
        Prefix: prefix,
        Marker: marker,
        MaxKeys: 1000,
      }, (err, data) => err ? reject(err) : resolve(data));
    });

    for (const item of data.Contents || []) {
      if (item.Key) keys.push(item.Key);
    }

    if (data.IsTruncated === 'true' || data.IsTruncated === true) {
      marker = data.NextMarker || keys[keys.length - 1];
    } else {
      break;
    }
  }

  return keys;
}

async function main() {
  console.log('Listing all images in COS bucket...');
  const keys = await listAllObjects('image/');
  console.log(`Found ${keys.length} files in image/ folder`);

  const mapping: Record<number, string> = {};

  for (const key of keys) {
    // key format: image/12345.jpg or image/12345.jpeg etc
    const filename = path.basename(key);
    const match = filename.match(/^(\d+)\.([a-zA-Z]+)$/);
    if (match) {
      const id = parseInt(match[1], 10);
      const ext = match[2].toLowerCase();
      mapping[id] = ext;
    }
  }

  const sortedIds = Object.keys(mapping).map(Number).sort((a, b) => a - b);
  console.log(`Parsed ${sortedIds.length} valid cover images`);

  const lines = [
    '/**',
    ' * Mapping of book ID to cover image file extension',
    ` * Auto-generated from COS bucket on ${new Date().toISOString().slice(0, 10)}`,
    ' * Run: npx dotenv -e .env tsx script/regenerate-cover-extensions.ts',
    ' */',
    'export const COVER_EXTENSIONS: Record<number, string> = {',
    ...sortedIds.map(id => `  ${id}: '${mapping[id]}',`),
    '};',
    '',
  ];

  const outputPath = path.join(process.cwd(), 'server', 'cover-extensions.ts');
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  console.log(`✅ Written to ${outputPath}`);
  console.log(`   Total entries: ${sortedIds.length}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
