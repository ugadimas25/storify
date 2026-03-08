import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function fixTableStructure() {
  console.log("Fixing referral_codes table structure...\n");
  
  try {
    // Drop the existing table (it's empty anyway)
    console.log("1. Dropping existing table...");
    await db.execute(sql`DROP TABLE IF EXISTS referral_codes CASCADE`);
    console.log("✓ Table dropped\n");
    
    // Recreate with correct structure from migration
    console.log("2. Creating table with correct structure...");
    await db.execute(sql`
      CREATE TABLE referral_codes (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL,
        discount_percent INTEGER NOT NULL DEFAULT 10,
        commission_percent INTEGER NOT NULL DEFAULT 5,
        usage_count INTEGER NOT NULL DEFAULT 0,
        max_usage INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✓ Table created\n");
    
    // Create indexes
    console.log("3. Creating indexes...");
    await db.execute(sql`CREATE INDEX idx_referral_codes_code ON referral_codes(code)`);
    await db.execute(sql`CREATE INDEX idx_referral_codes_user_id ON referral_codes(user_id)`);
    await db.execute(sql`CREATE INDEX idx_referral_codes_active ON referral_codes(is_active) WHERE is_active = TRUE`);
    console.log("✓ Indexes created\n");
    
    console.log("4. Table structure fixed! Now inserting DISKONLEBARAN code...");
    
    // Insert the promo code
    const result = await db.execute(sql`
      INSERT INTO referral_codes (code, user_id, discount_percent, commission_percent, usage_count, is_active, expires_at)
      VALUES ('DISKONLEBARAN', 'system-promo', 20, 0, 0, true, '2026-04-30')
      RETURNING *
    `);
    
    console.log("✓ Promo code created!");
    console.log(result.rows[0]);
    
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

fixTableStructure();
