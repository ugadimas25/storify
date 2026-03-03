import { db } from '../server/db';
import { books } from '../shared/schema';
import { ilike, or, sql } from 'drizzle-orm';

async function search() {
  const queries = [
    '%Richest Man%Babylon%',
    '%Richest%',
    '%Babylon%',
    '%parenting%anak%',
    '%parenting%',
    '%anak%usia%dini%',
    '%Sang Pemimpi%',
    '%Pemimpi%',
    '%Andrea Hirata%',
  ];
  
  for (const q of queries) {
    const results = await db.select({ 
      id: books.id, 
      title: sql`COALESCE(${books.titleFix}, ${books.title})`.as('title')
    })
      .from(books)
      .where(or(
        ilike(books.titleFix, q),
        ilike(books.title, q)
      ));
    console.log(`Query: ${q} → ${results.length} results`);
    for (const r of results.slice(0, 5)) {
      console.log(`  [${r.id}] ${r.title}`);
    }
    if (results.length > 5) console.log(`  ... and ${results.length - 5} more`);
  }
  process.exit(0);
}
search();
