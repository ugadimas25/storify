import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function checkAndFix() {
  console.log("Checking users table...\n");
  
  // Cek users yang ada
  const existingUsers = await db.execute(sql`
    SELECT id, email, name, first_name, created_at 
    FROM users 
    ORDER BY created_at DESC 
    LIMIT 5
  `);
  
  console.log("Existing users:");
  console.table(existingUsers.rows);
  
  // Cek apakah system-promo sudah ada
  const systemUser = await db.execute(sql`
    SELECT * FROM users WHERE id = 'system-promo'
  `);
  
  if (systemUser.rows.length === 0) {
    console.log("\n'system-promo' user not found. Creating...\n");
    
    await db.execute(sql`
      INSERT INTO users (id, email, name, first_name, last_name, email_verified)
      VALUES ('system-promo', 'promo@storify.internal', 'System Promo', 'System', 'Promo', true)
      ON CONFLICT (id) DO NOTHING
    `);
    
    console.log("✓ System promo user created!\n");
  } else {
    console.log("\n✓ System promo user already exists\n");
  }
  
  // Verify referral codes
  const codes = await db.execute(sql`
    SELECT r.*, u.email as owner_email
    FROM referral_codes r
    LEFT JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
  `);
  
  console.log("Referral codes with owner info:");
  console.table(codes.rows);
  
  process.exit(0);
}

checkAndFix();
