import XLSX from 'xlsx';
import { db } from '../server/db';
import { books } from '../shared/schema';

// Kategori mapping berdasarkan kata kunci di judul
const categoryKeywords: Record<string, string[]> = {
  'Self-Improvement': [
    'motivasi', 'inspirasi', 'mindset', 'habit', 'kebiasaan', 'sukses', 'success',
    'berdamai', 'bahagia', 'happiness', 'semangat', 'hebat', 'kuat', 'optimism',
    'produktif', 'gratitude', 'syukur', 'bodo amat', 'insecure', 'effective',
    'yes to life', 'gembira', 'lelah', 'malas', 'grit', 'passion', 'ikigai',
    'quarter life', 'berani', 'courage', 'habits', 'berjiwa besar', 'golden ticket'
  ],
  'Business': [
    'bisnis', 'business', 'entrepreneur', 'startup', 'marketing', 'selling',
    'kaya', 'rich', 'finansial', 'financial', 'rezeki', 'uang', 'money',
    'miliarder', 'penjualan', 'blue ocean', 'karyawan', 'crypto', 'bitcoin',
    'forex', 'trading', 'cuan', 'investasi', 'invest', 'babylon', 'money magnet'
  ],
  'Leadership': [
    'kepemimpinan', 'leadership', 'leader', 'pemimpin', 'memimpin', 'manage', 'boss'
  ],
  'Communication': [
    'bicara', 'speaking', 'komunikasi', 'communication', 'public speaking',
    'ngobrol', 'bahasa tubuh', 'copywriting', 'berbicara', 'retorika', 'ekspresi',
    'persuasi', 'influence', 'friends'
  ],
  'Education': [
    'belajar', 'membaca', 'baca', 'menulis', 'mengajar', 'guru', 'pendidikan',
    'alquran', 'tpa', 'toefl', 'bahasa inggris', 'mandarin', 'hsk', 'kursus'
  ],
  'Psychology': [
    'psikologi', 'psychology', 'hipnotis', 'hypno', 'kesehatan jiwa', 
    'kecemasan', 'introvert', 'people pleaser', 'dark psychology', 'manipulation',
    'emotions', 'emosi', 'firasat', 'aura', 'sherlock', 'think'
  ],
  'Lifestyle': [
    'hidup', 'rumah', 'sehat', 'minimalis', 'sahaja', 'montessori',
    'rubik', 'tiktok', 'breathing', 'workout', 'resep', 'bartending',
    'farmakologi', 'haid', 'nifas'
  ],
  'Religion': [
    'quran', 'sunnah', 'sufi', 'muslim', 'tuhan', 'pacaran', 'ilahi',
    'islam', 'aqidah', 'hadits', 'puasa', 'ibadah', 'sholeh', 'pernikahan',
    'menikah', 'nikah', 'zina', 'istri', 'hukum islam', 'doa', 'wasiat salaf',
    'banna', 'bulughul', 'fiqih'
  ],
  'Fiction': [
    'novel', 'cerita', 'harry potter', 'animal farm', 'sophie', 'laut bercerita',
    'sang pemimpi', 'hirata', 'fiersa', 'garis waktu', 'komet', 'hujan',
    'tere liye', 'puisi', 'pinurbo', 'dostoyevsky', 'hemingway', 'funiculi',
    'daun yang jatuh', 'pembunuhan', 'anak revolusi', 'cinta', 'married'
  ],
  'Technology': [
    'programming', 'algoritma', 'artificial intelligence', 'ai', 'hacking',
    'cyber', 'data', 'generative', 'api', 'kecerdasan buatan', 'bitcoin',
    'elon musk'
  ],
  'History': [
    'sejarah', 'history', 'revolusi', 'majapahit', 'hatta', 'zaman',
    'illuminati', 'anarkisme', 'politik', 'marxisme', 'homo deus'
  ],
};

function categorizeBook(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  return 'Self-Improvement'; // Default category
}

function extractAuthor(filename: string): string {
  // Pattern: "Title - Author.pdf"
  const match = filename.match(/\s*-\s*([^-]+)\.pdf$/i);
  if (match && match[1].length < 50) {
    const author = match[1].trim();
    // Skip if it looks like part of title
    if (!author.match(/^\d+$/) && author.length > 2) {
      return author;
    }
  }
  
  // Try pattern with parentheses: "Title (Author).pdf"
  const parenMatch = filename.match(/\(([^)]+)\)\s*\.pdf$/i);
  if (parenMatch && parenMatch[1].length < 50) {
    const author = parenMatch[1].trim();
    if (!author.match(/z-lib|Z-Library|PDFDrive|SFILE/i) && author.length > 2) {
      return author;
    }
  }
  
  // Try underscore pattern: "Title_Author.pdf"
  const underscoreMatch = filename.match(/_([^_]+)\.pdf$/i);
  if (underscoreMatch && underscoreMatch[1].length < 40) {
    const author = underscoreMatch[1].replace(/_/g, ' ').trim();
    if (!author.match(/z-lib|Z-Library|compress|pdf/i) && author.length > 3) {
      return author;
    }
  }
  
  return 'Unknown Author';
}

function extractTitle(filename: string): string {
  // Remove .pdf extension first
  let title = filename.replace(/\.pdf$/i, '');
  
  // Remove common suffixes
  title = title.replace(/\s*\([^)]*z-lib[^)]*\)/gi, '');
  title = title.replace(/\s*\([^)]*Z-Library[^)]*\)/gi, '');
  title = title.replace(/\s*\([^)]*PDFDrive[^)]*\)/gi, '');
  title = title.replace(/\s*\([^)]*SFILE[^)]*\)/gi, '');
  title = title.replace(/_compress$/i, '');
  title = title.replace(/\s*\d+$/, ''); // Remove trailing numbers
  
  // Try to remove author part (after last " - ")
  const lastDashIndex = title.lastIndexOf(' - ');
  if (lastDashIndex > 10) { // Only if there's substantial title before dash
    const possibleAuthor = title.substring(lastDashIndex + 3);
    if (possibleAuthor.length < 40 && !possibleAuthor.match(/^\d+$/)) {
      title = title.substring(0, lastDashIndex);
    }
  }
  
  // Clean up underscores and extra spaces
  title = title.replace(/_/g, ' ');
  title = title.replace(/\s+/g, ' ');
  
  // Remove leading numbers like "1234. " or "1234) "
  title = title.replace(/^\d+[\.\)]\s*/, '');
  
  return title.trim();
}

// Generate placeholder cover URL based on category
function getCoverUrl(category: string): string {
  const coverUrls: Record<string, string> = {
    'Self-Improvement': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=300&h=450',
    'Business': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=300&h=450',
    'Leadership': 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=300&h=450',
    'Communication': 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=300&h=450',
    'Education': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=300&h=450',
    'Psychology': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&q=80&w=300&h=450',
    'Lifestyle': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=300&h=450',
    'Religion': 'https://images.unsplash.com/photo-1585036156261-1e2ac055a590?auto=format&fit=crop&q=80&w=300&h=450',
    'Fiction': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=300&h=450',
    'Technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=300&h=450',
    'History': 'https://images.unsplash.com/photo-1461360370896-922624d12a74?auto=format&fit=crop&q=80&w=300&h=450',
  };
  return coverUrls[category] || coverUrls['Self-Improvement'];
}

// Generate random duration between 10-60 minutes (in seconds)
function getRandomDuration(): number {
  return Math.floor(Math.random() * 50 + 10) * 60; // 10-60 minutes
}

// Track imported titles to avoid duplicates
const importedTitles = new Set<string>();

async function importFromFile(filepath: string) {
  console.log(`\nReading ${filepath}...`);
  const wb = XLSX.readFile(filepath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
  
  // Skip header row
  const rows = data.slice(1);
  
  console.log(`Found ${rows.length} entries`);
  
  // Track categories for stats
  const categoryCount: Record<string, number> = {};
  let imported = 0;
  let skipped = 0;
  let featured = 0;
  
  for (const row of rows) {
    if (!row[1]) continue; // Skip empty rows
    
    const filename = row[1] as string;
    const title = extractTitle(filename);
    
    // Skip if already imported (check normalized title)
    const normalizedTitle = title.toLowerCase().replace(/\s+/g, ' ').trim();
    if (importedTitles.has(normalizedTitle)) {
      skipped++;
      continue;
    }
    importedTitles.add(normalizedTitle);
    
    const author = extractAuthor(filename);
    const category = categorizeBook(title);
    
    categoryCount[category] = (categoryCount[category] || 0) + 1;
    
    // Make some books featured (roughly 15%)
    const isFeatured = Math.random() < 0.15;
    if (isFeatured) featured++;
    
    const book = {
      title,
      author,
      description: `Buku "${title}" karya ${author}. Kategori: ${category}.`,
      coverUrl: getCoverUrl(category),
      audioUrl: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${(imported % 16) + 1}.mp3`,
      duration: getRandomDuration(),
      category,
      isFeatured,
    };
    
    try {
      await db.insert(books).values(book);
      imported++;
      console.log(`✓ [${category}] ${title}`);
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        skipped++;
      } else {
        console.error(`✗ Failed: ${title}`, error.message);
      }
    }
  }
  
  return { imported, skipped, featured, categoryCount };
}

async function importBooks() {
  console.log('=== Starting Book Import ===\n');
  
  const files = ['ref/list_nama_pdf.xlsx'];
  
  let totalImported = 0;
  let totalSkipped = 0;
  let totalFeatured = 0;
  const totalCategoryCount: Record<string, number> = {};
  
  for (const file of files) {
    const result = await importFromFile(file);
    totalImported += result.imported;
    totalSkipped += result.skipped;
    totalFeatured += result.featured;
    
    for (const [cat, count] of Object.entries(result.categoryCount)) {
      totalCategoryCount[cat] = (totalCategoryCount[cat] || 0) + count;
    }
  }
  
  console.log('\n=== Import Summary ===');
  console.log(`Total imported: ${totalImported}`);
  console.log(`Skipped (duplicates): ${totalSkipped}`);
  console.log(`Featured books: ${totalFeatured}`);
  console.log('\nBooks per category:');
  for (const [cat, count] of Object.entries(totalCategoryCount).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }
  
  process.exit(0);
}

importBooks().catch(console.error);
