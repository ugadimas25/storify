import "dotenv/config";
import { db } from "../server/db";
import { referralCodes, users } from "@db/schema";
import { eq } from "drizzle-orm";

async function createReferralCode() {
  console.log("Creating DISKONLEBARAN referral code...\n");
  
  // Find a user to assign the code to (or use a system user)
  const allUsers = await db.select().from(users).limit(1);
  
  let userId: string;
  
  if (allUsers.length > 0) {
    userId = allUsers[0].id;
    console.log("Assigning to existing user:", allUsers[0].email || allUsers[0].id);
  } else {
    // Create a system/admin user for promotional codes
    userId = "system-promo";
    console.log("Using system user:", userId);
  }
  
  // Check if code already exists
  const existing = await db.query.referralCodes.findFirst({
    where: eq(referralCodes.code, "DISKONLEBARAN"),
  });
  
  if (existing) {
    console.log("✓ Code already exists!");
    console.log(JSON.stringify(existing, null, 2));
    process.exit(0);
  }
  
  // Insert the promotional code using raw SQL to avoid schema inconsistencies
  const result = await db.execute(`
    INSERT INTO referral_codes (code, user_id, discount_percent, usage_count, is_active, expires_at)
    VALUES ('DISKONLEBARAN', '${userId}', 20, 0, true, '2026-04-30')
    RETURNING *
  `);
  
  console.log("\n✓ Referral code created successfully!");
  console.log(result);
  
  process.exit(0);
}

createReferralCode().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
