import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function checkTable() {
  console.log("Checking referral_codes table structure...\n");
  
  try {
    // Check if table exists and get its structure
    const tableInfo = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'referral_codes'
      ORDER BY ordinal_position;
    `);
    
    console.log("referral_codes table columns:");
    console.log(tableInfo.rows);
    
    // Try to select from the table
    const count = await db.execute(sql`SELECT COUNT(*) FROM referral_codes`);
    console.log("\nCurrent row count:", count.rows[0]?.count || 0);
    
  } catch (error: any) {
    console.error("Error:", error.message);
  }
  
  process.exit(0);
}

checkTable();
